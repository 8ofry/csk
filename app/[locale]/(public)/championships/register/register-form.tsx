"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { registerIndividualFighterAction } from "@/app/actions/championships";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IndividualRegisterForm({
  championshipId,
  championshipName,
  registrationFee,
  locale,
}: {
  championshipId: string;
  championshipName: string;
  registrationFee: number;
  locale: string;
}) {
  const isRtl = locale === "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("championshipId", championshipId);

    startTransition(async () => {
      setError(null);
      const res = await registerIndividualFighterAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/trainee/championships");
          router.refresh();
        }, 2000);
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-xl border border-csk-gold/30 bg-csk-gold/5 p-6 text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <h3 className="text-xl font-bold text-csk-gold">
          {isRtl ? "تم التسجيل بنجاح!" : "Registration Successful!"}
        </h3>
        <p className="text-sm text-neutral-300">
          {isRtl
            ? "لقد تم إنشاء حسابك وتسجيلك بنجاح. سيتم تحويلك إلى لوحة التحكم الخاصة بك..."
            : "Your account has been created and registration submitted. Redirecting to your dashboard..."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fighter Info Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-csk-gold border-b border-neutral-800 pb-2">
          👤 {isRtl ? "بيانات المقاتل الشخصية" : "Fighter Profile Info"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullNameEn" className="text-neutral-200">
              {isRtl ? "الاسم الكامل بالإنجليزية" : "Full Name (English)"}
            </Label>
            <Input
              id="fullNameEn"
              name="fullNameEn"
              required
              placeholder="e.g. Ahmed Mohamed"
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
            />
          </div>
          <div>
            <Label htmlFor="fullNameAr" className="text-neutral-200">
              {isRtl ? "الاسم الكامل بالعربية" : "Full Name (Arabic)"}
            </Label>
            <Input
              id="fullNameAr"
              name="fullNameAr"
              required
              dir="rtl"
              placeholder="مثال: أحمد محمد"
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="text-neutral-200">
              {isRtl ? "البريد الإلكتروني" : "Email Address"}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@example.com"
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-neutral-200">
              {isRtl ? "رقم الهاتف" : "Phone Number"}
            </Label>
            <Input
              id="phone"
              name="phone"
              required
              placeholder="+201000000000"
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-neutral-200">
            {isRtl ? "كلمة المرور للحساب" : "Account Password"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
          />
          <p className="text-[10px] text-neutral-500 mt-1">
            {isRtl
              ? "ستستخدم هذا البريد وكلمة المرور لاحقاً لتسجيل الدخول ومتابعة نتائجك ونزالاتك."
              : "You will use this email and password later to login and track your matches and results."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="gender" className="text-neutral-200">
              {isRtl ? "الجنس" : "Gender"}
            </Label>
            <select
              id="gender"
              name="gender"
              required
              className="mt-1 flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 text-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
            >
              <option value="MALE">{isRtl ? "ذكر" : "Male"}</option>
              <option value="FEMALE">{isRtl ? "أنثى" : "Female"}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="dob" className="text-neutral-200">
              {isRtl ? "تاريخ الميلاد" : "Date of Birth"}
            </Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              required
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
            />
          </div>
          <div>
            <Label htmlFor="photo" className="text-neutral-200">
              {isRtl ? "الصورة الشخصية" : "Profile Photo"}
            </Label>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold text-xs"
            />
          </div>
        </div>
      </div>

      {/* Fight Class / Weight Section */}
      <div className="space-y-4 pt-4 border-t border-neutral-900">
        <h3 className="text-lg font-bold text-csk-gold border-b border-neutral-800 pb-2">
          🥊 {isRtl ? "فئة القتال والوزن" : "Fight Class & Division"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fightClass" className="text-neutral-200">
              {isRtl ? "فئة النزال" : "Fight Division Class"}
            </Label>
            <select
              id="fightClass"
              name="fightClass"
              required
              className="mt-1 flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 text-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
            >
              <option value="AMATEUR">{isRtl ? "هواة (Amateur)" : "Amateur"}</option>
              <option value="SEMI_PRO">{isRtl ? "نصف محترف (Half-Pro)" : "Half-Pro / Semi-Pro"}</option>
              <option value="PROFESSIONAL">{isRtl ? "محترف (Professional)" : "Professional"}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="weightKg" className="text-neutral-200">
              {isRtl ? "الوزن الحالي (كيلوجرام)" : "Current Weight (kg)"}
            </Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              min={20}
              max={200}
              required
              placeholder="e.g. 75"
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
            />
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4 pt-4 border-t border-neutral-900">
        <h3 className="text-lg font-bold text-csk-gold border-b border-neutral-800 pb-2">
          💳 {isRtl ? "رسوم الاشتراك والدفع" : "Registration Fee & Payment"}
        </h3>
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg space-y-3">
          <p className="text-sm font-semibold">
            {isRtl ? "البطولة:" : "Event:"} <span className="text-csk-gold font-bold">{championshipName}</span>
          </p>
          <p className="text-sm font-semibold">
            {isRtl ? "الرسوم المطلوبة:" : "Amount to Pay:"} <span className="text-emerald-500 font-bold">{registrationFee.toFixed(2)} EGP</span>
          </p>
          <div className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/60 pt-3 space-y-1">
            <p className="font-bold text-neutral-300">
              {isRtl ? "خطوات دفع InstaPay:" : "InstaPay Payment Steps:"}
            </p>
            <p>{isRtl ? "1. افتح تطبيق InstaPay الخاص بك." : "1. Open your InstaPay app."}</p>
            <p>
              {isRtl
                ? "2. قم بالتحويل إلى عنوان InstaPay الخاص بالأكاديمية أو رقم الحساب."
                : "2. Transfer the fee to the academy's InstaPay address or bank details."}
            </p>
            <p>
              {isRtl
                ? "3. انسخ الرقم المرجعي للعملية (Reference Number)."
                : "3. Copy the transaction reference number."}
            </p>
            <p>
              {isRtl
                ? "4. التقط لقطة شاشة لإثبات الدفع (Receipt Screenshot)."
                : "4. Take a screenshot of the payment receipt."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="instapayRef" className="text-neutral-200">
              {isRtl ? "الرقم المرجعي للمعاملة (Reference ID)" : "InstaPay Transaction Reference"}
            </Label>
            <Input
              id="instapayRef"
              name="instapayRef"
              required
              placeholder="e.g. 123456789"
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold"
            />
          </div>
          <div>
            <Label htmlFor="receipt" className="text-neutral-200">
              {isRtl ? "صورة إيصال الدفع" : "Upload Receipt Screenshot"}
            </Label>
            <Input
              id="receipt"
              name="receipt"
              type="file"
              accept="image/*"
              required
              className="mt-1 bg-neutral-900 border-neutral-800 text-white focus-visible:ring-csk-gold text-xs"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-csk-gold hover:bg-csk-goldLight text-csk-black font-black uppercase py-6 rounded-full transition-all text-sm tracking-wider"
      >
        {pending ? (isRtl ? "جاري التسجيل..." : "Registering...") : (isRtl ? "إرسال التسجيل والدفع" : "Submit Registration & Payment")}
      </Button>
    </form>
  );
}
