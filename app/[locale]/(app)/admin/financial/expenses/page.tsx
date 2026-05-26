import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listExpenses, getRecurringDuesForMonth, listRecurringExpenses } from "@/application/financial/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/admin/expense-form";
import { ExpenseRowActions } from "@/components/admin/expense-row-actions";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/infrastructure/db/prisma";
import { coachEarnings } from "@/application/financial/dashboards";
import { RecurringForm } from "@/components/admin/recurring-form";
import { RecurringRowActions } from "@/components/admin/recurring-row-actions";

export default async function AdminExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    tab?: string;
    category?: string;
    amount?: string;
    recipientUserId?: string;
    recurringExpenseId?: string;
    description?: string;
  }>;
}) {
  await requireRole("HEAD_COACH");
  const { locale } = await params;
  const sp = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = sp.from ? new Date(sp.from) : defaultFrom;
  const to = sp.to ? new Date(sp.to) : now;

  const currentTab = sp.tab || "logged";

  const formInitialCategory = sp.category || "RENT";
  const formInitialAmount = sp.amount || "";
  const formInitialRecipientUserId = sp.recipientUserId || "";
  const formInitialRecurringExpenseId = sp.recurringExpenseId || "";
  const formInitialDescription = sp.description || "";

  const [t, tCommon, expenses, coaches, recurringDues, recurringRules] = await Promise.all([
    getTranslations("adminExpenses"),
    getTranslations("common"),
    listExpenses({ from, to }),
    prisma.user.findMany({
      where: {
        role: { in: ["COACH", "HEAD_COACH"] },
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullNameEn: true,
        fullNameAr: true,
      },
      orderBy: { fullNameEn: "asc" },
    }),
    getRecurringDuesForMonth(from.getFullYear(), from.getMonth() + 1),
    listRecurringExpenses(),
  ]);

  const coachOptions = coaches.map((c) => ({
    id: c.id,
    name: locale === "ar" ? c.fullNameAr : c.fullNameEn,
  }));

  // Fetch coach payout summary for the filtered period
  const coachPayouts = await Promise.all(
    coaches.map(async (coach) => {
      const earnings = await coachEarnings(coach.id, { from, to });
      const payments = await prisma.expense.aggregate({
        where: {
          category: { in: ["SALARIES", "COACH_PAYOUT"] },
          recipientUserId: coach.id,
          paidAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      });
      const paid = Number(payments._sum.amount ?? 0);
      const due = earnings.total - paid;

      return {
        id: coach.id,
        name: locale === "ar" ? coach.fullNameAr : coach.fullNameEn,
        accrued: earnings.total,
        paid,
        due,
      };
    })
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const loggedTabUrl = `/admin/financial/expenses?tab=logged&from=${fromStr}&to=${toStr}`;
  const payoutsTabUrl = `/admin/financial/expenses?tab=payouts&from=${fromStr}&to=${toStr}`;
  const recurringTabUrl = `/admin/financial/expenses?tab=recurring&from=${fromStr}&to=${toStr}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link href="/admin/financial">
                ←
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Period filter */}
      <form className="flex items-end gap-3 bg-card p-4 rounded-lg border border-border shadow-sm max-w-xl">
        <input type="hidden" name="tab" value={currentTab} />
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {tCommon("from") || "From"}
          </label>
          <input
            type="date"
            name="from"
            defaultValue={fromStr}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-csk-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {tCommon("to") || "To"}
          </label>
          <input
            type="date"
            name="to"
            defaultValue={toStr}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-csk-gold"
          />
        </div>
        <Button type="submit" size="sm" className="bg-csk-gold hover:bg-csk-gold/80 text-black">
          {tCommon("apply") || "Apply"}
        </Button>
      </form>

      {/* Tabs bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href={loggedTabUrl}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              currentTab === "logged"
                ? "border-csk-gold text-csk-gold font-bold"
                : "border-transparent text-muted-foreground hover:border-muted hover:text-foreground"
            }`}
          >
            {t("tabs.logged") || "Expenses Log"}
          </Link>
          <Link
            href={payoutsTabUrl}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              currentTab === "payouts"
                ? "border-csk-gold text-csk-gold font-bold"
                : "border-transparent text-muted-foreground hover:border-muted hover:text-foreground"
            }`}
          >
            {t("tabs.payouts") || "Coach Payouts"}
          </Link>
          <Link
            href={recurringTabUrl}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              currentTab === "recurring"
                ? "border-csk-gold text-csk-gold font-bold"
                : "border-transparent text-muted-foreground hover:border-muted hover:text-foreground"
            }`}
          >
            {t("tabs.recurring") || "Recurring Dues"}
          </Link>
        </nav>
      </div>

      {currentTab === "logged" && (
        <>
          {/* KPI Card */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-csk-gold/40 shadow-sm bg-gradient-to-br from-background to-card">
              <CardHeader className="pb-2">
                <div className="text-sm text-muted-foreground">{t("kpi.totalExpenses")}</div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-csk-gold">
                  {totalExpenses.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">EGP</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Expenses List */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>{t("title")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.date")}</TableHead>
                        <TableHead>{t("table.category")}</TableHead>
                        <TableHead>{t("table.method")}</TableHead>
                        <TableHead className="text-end">{t("table.amount")}</TableHead>
                        <TableHead>{t("table.loggedBy")}</TableHead>
                        <TableHead className="text-end">{t("table.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell className="text-xs">
                            {exp.paidAt.toLocaleDateString()}{" "}
                            <span className="text-muted-foreground">
                              {exp.paidAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {exp.recipientUser && (
                              <div className="mt-1 text-xs font-semibold text-csk-gold">
                                → {locale === "ar" ? exp.recipientUser.fullNameAr : exp.recipientUser.fullNameEn}
                              </div>
                            )}
                            {exp.description && (
                              <div className="mt-1 text-xs text-muted-foreground italic max-w-xs break-words">
                                {exp.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{t(`categories.${exp.category}`)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{exp.method}</TableCell>
                          <TableCell className="text-end font-medium">{Number(exp.amount).toFixed(2)}</TableCell>
                          <TableCell className="text-xs">
                            {locale === "ar" ? exp.loggedBy.fullNameAr : exp.loggedBy.fullNameEn}
                          </TableCell>
                          <TableCell className="text-end">
                            <ExpenseRowActions expenseId={exp.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {expenses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {t("empty")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Record Form */}
            <div>
              <Card className="shadow-sm border-csk-gold/20">
                <CardHeader>
                  <CardTitle>{t("recordExpense")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseForm
                    key={formInitialCategory + formInitialAmount + formInitialRecipientUserId + formInitialRecurringExpenseId + formInitialDescription}
                    coaches={coachOptions}
                    initialCategory={formInitialCategory}
                    initialAmount={formInitialAmount}
                    initialRecipientUserId={formInitialRecipientUserId}
                    initialRecurringExpenseId={formInitialRecurringExpenseId}
                    initialDescription={formInitialDescription}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {currentTab === "payouts" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("payouts.title") || "Coach Payouts (MTD)"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payouts.coach") || "Coach"}</TableHead>
                  <TableHead className="text-end">{t("payouts.accrued") || "MTD Accrued Split"}</TableHead>
                  <TableHead className="text-end">{t("payouts.paid") || "MTD Paid Payouts"}</TableHead>
                  <TableHead className="text-end">{t("payouts.due") || "Net Due Balance"}</TableHead>
                  <TableHead className="text-end">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coachPayouts.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell className="font-semibold">{coach.name}</TableCell>
                    <TableCell className="text-end text-green-500 font-medium">
                      {coach.accrued.toFixed(2)} EGP
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {coach.paid.toFixed(2)} EGP
                    </TableCell>
                    <TableCell className={`text-end font-bold ${coach.due > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {coach.due.toFixed(2)} EGP
                    </TableCell>
                    <TableCell className="text-end">
                      {coach.due > 0 ? (
                        <Button asChild size="sm" className="bg-csk-gold hover:bg-csk-gold/80 text-black">
                          <Link
                            href={`/admin/financial/expenses?tab=logged&from=${fromStr}&to=${toStr}&category=COACH_PAYOUT&recipientUserId=${coach.id}&amount=${coach.due.toFixed(2)}&description=${encodeURIComponent(
                              `Payout/Salary for ${coach.name}`
                            )}`}
                          >
                            {t("payouts.pay") || "Pay Coach"}
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Paid</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {coachPayouts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t("payouts.noCoaches") || "No coaches found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {currentTab === "recurring" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recurring dues & status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dues checklist */}
            <Card className="shadow-sm border-l-4 border-l-csk-gold">
              <CardHeader>
                <CardTitle>{t("recurring.duesTitle") || "Monthly Recurring Status (Dues)"}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Status for {from.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("recurring.category") || "Category"}</TableHead>
                      <TableHead>{t("recurring.day") || "Due Day"}</TableHead>
                      <TableHead className="text-end">{t("recurring.amount") || "Amount"}</TableHead>
                      <TableHead>{t("recurring.status") || "Status"}</TableHead>
                      <TableHead className="text-end">{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringDues.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <span className="font-semibold">{t(`categories.${item.category}`)}</span>
                          {item.description && (
                            <span className="block text-xs text-muted-foreground italic">{item.description}</span>
                          )}
                        </TableCell>
                        <TableCell>Day {item.dayOfMonth}</TableCell>
                        <TableCell className="text-end font-medium">{item.amount.toFixed(2)} EGP</TableCell>
                        <TableCell>
                          {item.isPaid ? (
                            <Badge className="bg-green-600 text-white hover:bg-green-700">
                              {t("recurring.paid") || "Paid"}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              {t("recurring.due") || "Due"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-end">
                          {!item.isPaid ? (
                            <Button asChild size="sm" variant="outline" className="border-csk-gold text-csk-gold hover:bg-csk-gold/10">
                              <Link
                                href={`/admin/financial/expenses?tab=logged&from=${fromStr}&to=${toStr}&category=${
                                  item.category
                                }&amount=${item.amount.toFixed(2)}&recurringExpenseId=${
                                  item.id
                                }&description=${encodeURIComponent(
                                  `[Recurring] ${t(`categories.${item.category}`)} for ${from.toLocaleString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                  })}`
                                )}`}
                              >
                                {t("recurring.pay") || "Record Payment"}
                              </Link>
                            </Button>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Paid on {item.paidExpense?.paidAt ? new Date(item.paidExpense.paidAt).toLocaleDateString() : ""}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {recurringDues.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No recurring expenses configured.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Rules list */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("recurring.title") || "Active Recurring Expenses"}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("recurring.category") || "Category"}</TableHead>
                      <TableHead>{t("recurring.day") || "Due Day"}</TableHead>
                      <TableHead className="text-end">{t("recurring.amount") || "Amount"}</TableHead>
                      <TableHead className="text-end">{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <span className="font-semibold">{t(`categories.${rule.category}`)}</span>
                          {rule.description && (
                            <span className="block text-xs text-muted-foreground italic">{rule.description}</span>
                          )}
                        </TableCell>
                        <TableCell>Day {rule.dayOfMonth}</TableCell>
                        <TableCell className="text-end font-medium">{Number(rule.amount).toFixed(2)} EGP</TableCell>
                        <TableCell className="text-end">
                          <RecurringRowActions ruleId={rule.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {recurringRules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No recurring expenses defined.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Create Rule Form */}
          <div>
            <Card className="shadow-sm border-csk-gold/20">
              <CardHeader>
                <CardTitle>{t("recurring.addRecurring") || "Add Recurring Expense Rule"}</CardTitle>
              </CardHeader>
              <CardContent>
                <RecurringForm />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

