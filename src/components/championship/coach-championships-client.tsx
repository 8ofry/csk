"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { registerFighterAction, submitInstapayPaymentAction } from "@/app/actions/championships";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FighterCard } from "@/components/championship/fighter-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CoachChampionshipsClientProps {
  championships: any[];
  initialRegistrations: any[];
  academy: { id: string; nameAr: string; nameEn: string };
  selectedId: string;
  locale: string;
}

export function CoachChampionshipsClient({
  championships,
  initialRegistrations,
  academy,
  selectedId,
  locale,
}: CoachChampionshipsClientProps) {
  const t = useTranslations("coachChampionships");
  const router = useRouter();
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(selectedId);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [activeFighterCard, setActiveFighterCard] = useState<any | null>(null);
  const [activePaymentReg, setActivePaymentReg] = useState<any | null>(null);

  const [regError, setRegError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const [pendingReg, startTransitionReg] = useTransition();
  const [pendingPay, startTransitionPay] = useTransition();

  const handleChampionshipChange = (id: string) => {
    setSelectedChampionshipId(id);
    router.push(`/coach/championships?id=${id}`);
  };

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("championshipId", selectedChampionshipId);

    startTransitionReg(async () => {
      setRegError(null);
      const res = await registerFighterAction(fd);
      if (res?.error) {
        setRegError(res.error);
      } else {
        setRegisterOpen(false);
        e.currentTarget.reset();
        router.refresh();
      }
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!activePaymentReg) return;
    fd.append("registrationId", activePaymentReg.id);

    startTransitionPay(async () => {
      setPayError(null);
      const res = await submitInstapayPaymentAction(fd);
      if (res?.error) {
        setPayError(res.error);
      } else {
        setActivePaymentReg(null);
        e.currentTarget.reset();
        router.refresh();
      }
    });
  };

  const currentChampionship = championships.find((c) => c.id === selectedChampionshipId);
  const academyName = locale === "ar" ? academy.nameAr : academy.nameEn;

  return (
    <div className="space-y-6">
      {/* Title & Select */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="championship-select" className="shrink-0 text-sm font-semibold">
            {locale === "ar" ? "اختر البطولة:" : "Championship:"}
          </Label>
          <select
            id="championship-select"
            value={selectedChampionshipId}
            onChange={(e) => handleChampionshipChange(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
          >
            {championships.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentChampionship && (
        <Card className="border-csk-gold/20">
          <CardHeader className="bg-muted/30">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-csk-gold text-2xl font-bold">{currentChampionship.name}</CardTitle>
                <CardDescription className="mt-1">
                  {locale === "ar" ? "المنظم:" : "Organizer:"} {currentChampionship.organizer} ·{" "}
                  {new Date(currentChampionship.startDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button
                onClick={() => setRegisterOpen(!registerOpen)}
                className="bg-csk-gold text-csk-black hover:bg-csk-goldLight font-bold"
              >
                {t("registerFighter")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Register Fighter Form */}
            {registerOpen && (
              <form
                onSubmit={handleRegisterSubmit}
                className="mb-8 p-6 border rounded-lg bg-muted/20 space-y-4 border-csk-gold/30 relative"
              >
                <h3 className="text-lg font-bold text-csk-gold pb-1 border-b">
                  {locale === "ar" ? "تسجيل مقاتل جديد" : "Register New Fighter"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullNameAr">{t("fullNameAr")}</Label>
                    <Input id="fullNameAr" name="fullNameAr" required dir="rtl" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="fullNameEn">{t("fullNameEn")}</Label>
                    <Input id="fullNameEn" name="fullNameEn" required className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input id="phone" name="phone" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="gender">{t("gender")}</Label>
                    <select
                      id="gender"
                      name="gender"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1 focus:border-csk-gold focus:outline-none"
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="dob">{t("dob")}</Label>
                    <Input id="dob" name="dob" type="date" required className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="weightKg">{t("weight")} (kg)</Label>
                    <Input id="weightKg" name="weightKg" type="number" step="0.1" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="fightClass">{t("fightClass")}</Label>
                    <select
                      id="fightClass"
                      name="fightClass"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1 focus:border-csk-gold focus:outline-none"
                    >
                      <option value="AMATEUR">AMATEUR</option>
                      <option value="SEMI_PRO">HALF PRO</option>
                      <option value="PROFESSIONAL">PROFESSIONAL</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="photo">{t("photo")}</Label>
                    <Input id="photo" name="photo" type="file" accept="image/*" className="mt-1" />
                  </div>
                </div>

                {regError && <p className="text-sm text-destructive">{regError}</p>}

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setRegisterOpen(false)}>
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={pendingReg}
                    className="bg-csk-gold text-csk-black hover:bg-csk-goldLight"
                  >
                    {pendingReg ? "..." : locale === "ar" ? "حفظ" : "Save Fighter"}
                  </Button>
                </div>
              </form>
            )}

            {/* Trainee Roster Table */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-bold mb-4">{t("listHeader")}</h3>
              {initialRegistrations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t("noFighters")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("fighterName")}</TableHead>
                      <TableHead>{t("gender")}</TableHead>
                      <TableHead>{t("weight")}</TableHead>
                      <TableHead>{t("fightClass")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("payment")}</TableHead>
                      <TableHead className="text-right">{t("idCard")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialRegistrations.map((reg) => {
                      const f = reg.trainee;
                      const statusColorMap: Record<string, string> = {
                        COACH_CONFIRMED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
                        PENDING_VERIFICATION: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                        PAID: "bg-green-500/10 text-green-500 border-green-500/20",
                        WITHDREW: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
                      };

                      return (
                        <TableRow key={reg.id} className="hover:bg-muted/10">
                          <TableCell className="font-semibold">
                            <div>{locale === "ar" ? f.fullNameAr : f.fullNameEn}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {reg.registrationNumber}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs uppercase">{f.gender}</TableCell>
                          <TableCell className="text-sm">{reg.weightKg} kg</TableCell>
                          <TableCell className="text-sm font-bold">{reg.fightClass}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColorMap[reg.status]}>
                              {reg.status === "PAID"
                                ? t("paid")
                                : reg.status === "PENDING_VERIFICATION"
                                ? t("pending")
                                : t("coachConfirmed")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {reg.status === "PAID" ? (
                              <span className="text-green-500 text-xs font-semibold font-mono">
                                REF: {reg.instapayRef}
                              </span>
                            ) : reg.status === "PENDING_VERIFICATION" ? (
                              <span className="text-yellow-500 text-xs font-semibold font-mono">
                                VERIFYING: {reg.instapayRef}
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActivePaymentReg(reg)}
                                className="border-csk-gold text-csk-gold hover:bg-csk-gold/10 text-xs"
                              >
                                {t("submitPayment")}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveFighterCard(reg)}
                              className="text-csk-gold hover:text-csk-goldLight hover:bg-csk-gold/10"
                            >
                              {locale === "ar" ? "عرض البطاقة" : "Show ID"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Reference Modal */}
      {activePaymentReg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-csk-gold/30">
            <CardHeader>
              <CardTitle className="text-csk-gold">{t("submitPayment")}</CardTitle>
              <CardDescription>{t("instapayNotice")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="instapayRef">{t("instapayRef")}</Label>
                  <Input id="instapayRef" name="instapayRef" required placeholder="e.g. 5621489" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="receipt">{t("receipt")}</Label>
                  <Input id="receipt" name="receipt" type="file" accept="image/*" required className="mt-1" />
                </div>

                {payError && <p className="text-sm text-destructive">{payError}</p>}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setActivePaymentReg(null)}>
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={pendingPay}
                    className="bg-csk-gold text-csk-black hover:bg-csk-goldLight"
                  >
                    {pendingPay ? "..." : t("submit")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ID Card Modal */}
      {activeFighterCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-csk-gold/20 p-6 rounded-lg max-w-sm w-full space-y-4 relative">
            <button
              onClick={() => setActiveFighterCard(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-white"
            >
              ✕
            </button>
            <FighterCard
              fighter={activeFighterCard.trainee}
              registration={activeFighterCard}
              academyName={academyName}
            />
          </div>
        </div>
      )}
    </div>
  );
}
