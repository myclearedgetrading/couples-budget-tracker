// Verifies month rollover against DATABASE_URL, then removes everything it made.
//   node --env-file=.env.local scripts/verify-rollover.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// Months chosen far enough out that they cannot collide with real data.
const PROBE = "2027-03-01";
let householdId;
let probeMonthId;

try {
  // --- clamp_day_to_month: the edge cases that break naive date arithmetic ---
  const clamps = await sql`
    select
      public.clamp_day_to_month('2027-02-01'::date, '2027-01-31'::date) as jan31_to_feb,
      public.clamp_day_to_month('2028-02-01'::date, '2028-01-31'::date) as jan31_to_leap_feb,
      public.clamp_day_to_month('2027-04-01'::date, '2027-03-31'::date) as mar31_to_apr,
      public.clamp_day_to_month('2027-02-01'::date, '2027-01-01'::date) as first_of_month,
      public.clamp_day_to_month('2027-02-01'::date, '2027-01-15'::date) as mid_month
  `;
  const c = clamps[0];
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  check("Jan 31 clamps to Feb 28", iso(c.jan31_to_feb), "2027-02-28");
  check("Jan 31 clamps to Feb 29 in a leap year", iso(c.jan31_to_leap_feb), "2028-02-29");
  check("Mar 31 clamps to Apr 30", iso(c.mar31_to_apr), "2027-04-30");
  check("1st stays the 1st", iso(c.first_of_month), "2027-02-01");
  check("15th stays the 15th", iso(c.mid_month), "2027-02-15");

  // --- end-to-end rollover against the real household ---
  const households = await sql`
    select hm.household_id, hm.user_id
      from public.household_members hm
     where hm.status = 'active'
     order by hm.joined_at
     limit 1
  `;
  if (!households[0]) {
    console.log("SKIP  no household to roll over");
  } else {
    householdId = households[0].household_id;
    const actorId = households[0].user_id;

    const source = await sql`
      select bm.id, bm.month_start,
             (select count(*) from public.bills b
               where b.budget_month_id = bm.id and b.is_recurring) as recurring_bills,
             (select count(*) from public.income i
               where i.budget_month_id = bm.id and i.is_recurring) as recurring_income
        from public.budget_months bm
       where bm.household_id = ${householdId} and bm.month_start < ${PROBE}
       order by bm.month_start desc
       limit 1
    `;
    const expectedBills = Number(source[0]?.recurring_bills ?? 0);
    const expectedIncome = Number(source[0]?.recurring_income ?? 0);
    console.log(
      `\nsource month ${new Date(source[0].month_start).toISOString().slice(0, 10)}: ` +
        `${expectedBills} recurring bills, ${expectedIncome} recurring income\n`,
    );

    const first = await sql`
      select public.ensure_budget_month(${householdId}, ${PROBE}::date, ${actorId}) as id
    `;
    probeMonthId = first[0].id;

    const after = await sql`
      select
        (select count(*) from public.bills where budget_month_id = ${probeMonthId}) as bills,
        (select count(*) from public.income where budget_month_id = ${probeMonthId}) as income,
        (select count(*) from public.bills
          where budget_month_id = ${probeMonthId} and status <> 'planned') as not_planned,
        (select count(*) from public.bills
          where budget_month_id = ${probeMonthId}
            and (paid_at is not null or paid_by is not null)) as still_paid,
        (select count(*) from public.bills
          where budget_month_id = ${probeMonthId}
            and date_trunc('month', due_date)::date <> ${PROBE}::date) as outside_month
    `;
    check("recurring bills copied forward", Number(after[0].bills), expectedBills);
    check("recurring income copied forward", Number(after[0].income), expectedIncome);
    check("copied bills reset to planned", Number(after[0].not_planned), 0);
    check("copied bills cleared paid_at/paid_by", Number(after[0].still_paid), 0);
    check("copied due dates land inside the month", Number(after[0].outside_month), 0);

    // Running again is what happens when both partners load the app at once.
    const second = await sql`
      select public.ensure_budget_month(${householdId}, ${PROBE}::date, ${actorId}) as id
    `;
    check("second call returns the same month", second[0].id, probeMonthId);

    const afterSecond = await sql`
      select
        (select count(*) from public.bills where budget_month_id = ${probeMonthId}) as bills,
        (select count(*) from public.income where budget_month_id = ${probeMonthId}) as income
    `;
    check("second call adds no duplicate bills", Number(afterSecond[0].bills), expectedBills);
    check("second call adds no duplicate income", Number(afterSecond[0].income), expectedIncome);

    // Concurrent first-visit by both partners.
    await sql`delete from public.activity_logs
               where entity_id = ${probeMonthId} and action = 'rolled_over'`;
    await sql`delete from public.bills where budget_month_id = ${probeMonthId}`;
    await sql`delete from public.income where budget_month_id = ${probeMonthId}`;
    await Promise.all(
      Array.from({ length: 4 }, () =>
        sql`select public.ensure_budget_month(${householdId}, ${PROBE}::date, ${actorId}) as id`,
      ),
    );
    const afterRace = await sql`
      select (select count(*) from public.bills where budget_month_id = ${probeMonthId}) as bills
    `;
    check("four concurrent calls copy bills once", Number(afterRace[0].bills), expectedBills);
  }

  // --- authorization ---
  if (householdId) {
    let rejected = false;
    try {
      await sql`select public.ensure_budget_month(
        ${householdId}, ${PROBE}::date, '00000000-0000-0000-0000-000000000000'::uuid)`;
    } catch (error) {
      rejected = /not authorized/i.test(error.message);
    }
    check("non-member is rejected", rejected, true);
  }
} finally {
  if (probeMonthId) {
    await sql`delete from public.activity_logs where entity_id = ${probeMonthId}`;
    await sql`delete from public.budget_months where id = ${probeMonthId}`;
    console.log("\ncleaned up probe month");
  }
  await sql.end();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exitCode = failures ? 1 : 0;
