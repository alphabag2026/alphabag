import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle, Upload, FileText, Image, Presentation,
  Mail, Send, Star, DollarSign, Clock, Users, ChevronRight, ChevronLeft, Loader2, AlertCircle
} from "lucide-react";

type Step = "info" | "verify" | "upload" | "preview" | "fee" | "done";

interface ParsedPlan {
  name?: string;
  label?: string;
  dailyRate?: string;
  minAmount?: string;
  description?: string;
  badgeLabels?: string[];
  tags?: string[];
  ratioInfo?: string;
  yieldInfo?: string;
  logoUrl?: string;
  rating?: string;
}

export default function SubmitPlan() {
  const [step, setStep] = useState<Step>("info");
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  // Step 1: 신청자 정보
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");

  // Step 2: 인증
  const [emailCode, setEmailCode] = useState("");
  const [telegramCode, setTelegramCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [telegramVerified, setTelegramVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);

  // Step 3: 파일 업로드 & AI 파싱
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null);
  const [finalPlan, setFinalPlan] = useState<ParsedPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 5: 상장비용
  const [txHash, setTxHash] = useState("");

  const { data: settings } = trpc.submissions.getSettings.useQuery();
  const sendEmailCode = trpc.submissions.sendEmailCode.useMutation();
  const verifyEmailCode = trpc.submissions.verifyEmailCode.useMutation();
  const sendTelegramCode = trpc.submissions.sendTelegramCode.useMutation();
  const verifyTelegramCode = trpc.submissions.verifyTelegramCode.useMutation();
  const createSubmission = trpc.submissions.create.useMutation();
  const confirmFee = trpc.submissions.confirmFeePayment.useMutation();
  const parseFromFile = trpc.aiPlanImport.parseFromFile.useMutation();

  const handleSendEmailCode = async () => {
    if (!email) return toast.error("이메일을 입력해주세요.");
    try {
      await sendEmailCode.mutateAsync({ email });
      setEmailSent(true);
      toast.success("이메일 인증 코드가 발송되었습니다. (10분 유효)");
    } catch (e: any) {
      toast.error(e.message ?? "발송 실패");
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailCode) return toast.error("인증 코드를 입력해주세요.");
    try {
      await verifyEmailCode.mutateAsync({ email, code: emailCode });
      setEmailVerified(true);
      toast.success("이메일 인증 완료!");
    } catch (e: any) {
      toast.error(e.message ?? "인증 실패");
    }
  };

  const handleSendTelegramCode = async () => {
    if (!telegram) return toast.error("텔레그램 핸들을 입력해주세요.");
    try {
      await sendTelegramCode.mutateAsync({ telegram });
      setTelegramSent(true);
      toast.success("텔레그램으로 인증 코드가 발송되었습니다.");
    } catch (e: any) {
      toast.error(e.message ?? "발송 실패");
    }
  };

  const handleVerifyTelegram = async () => {
    if (!telegramCode) return toast.error("인증 코드를 입력해주세요.");
    try {
      await verifyTelegramCode.mutateAsync({ telegram, code: telegramCode });
      setTelegramVerified(true);
      toast.success("텔레그램 인증 완료!");
    } catch (e: any) {
      toast.error(e.message ?? "인증 실패");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // S3 업로드
      const formData = new FormData();
      formData.append("file", file);
      // 파일을 base64로 변환
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const base64 = btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(""));
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const ft = ext === "pptx" || ext === "ppt" ? "ppt" : ext === "pdf" ? "pdf" : ["jpg","jpeg","png","webp"].includes(ext) ? "image" : "text";
      setFileUrl(file.name);
      setFileType(ft);
      toast.success("파일 처리 중... AI 파싱 시작!");
      // AI 파싱 (base64 방식)
      setParsing(true);
      const result = await parseFromFile.mutateAsync({ base64, mimeType: file.type || "application/octet-stream", fileName: file.name });
      if (result.plan) {
        setParsedPlan(result.plan as ParsedPlan);
        setFinalPlan(result.plan as ParsedPlan);
        toast.success("AI 파싱 완료! 내용을 확인해주세요.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "파일 처리 실패");
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleCreateSubmission = async () => {
    try {
      const res = await createSubmission.mutateAsync({
        applicantName: name,
        applicantEmail: email,
        applicantTelegram: telegram || undefined,
        emailVerified,
        telegramVerified,
        fileUrl: fileUrl || undefined,
        fileType: fileType || undefined,
        parsedPlanData: parsedPlan,
        finalPlanData: finalPlan,
      });
      setSubmissionId(res.submissionId);
      setStep("fee");
    } catch (e: any) {
      toast.error(e.message ?? "신청 실패");
    }
  };

  const handleConfirmFee = async () => {
    if (!txHash || !submissionId) return toast.error("트랜잭션 해시를 입력해주세요.");
    try {
      await confirmFee.mutateAsync({ submissionId, txHash });
      setStep("done");
      toast.success("상장비용 납부가 확인되었습니다!");
    } catch (e: any) {
      toast.error(e.message ?? "확인 실패");
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: "info", label: "신청자 정보" },
    { key: "verify", label: "본인 인증" },
    { key: "upload", label: "자료 업로드" },
    { key: "preview", label: "플랜 확인" },
    { key: "fee", label: "상장비용" },
    { key: "done", label: "완료" },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-4">
            <Star className="w-4 h-4" /> 골든 컬렉션 상장 신청
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">플랜 등록 신청</h1>
          <p className="text-slate-400 text-sm">PPT, PDF, 이미지를 업로드하면 AI가 자동으로 플랜을 구성합니다</p>
        </div>

        {/* 스텝 인디케이터 - 모바일 최적화 */}
        <div className="mb-8">
          {/* 모바일: 원형 + 연결선만 */}
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all ${
                    i < stepIdx ? "bg-amber-500 text-black" :
                    i === stepIdx ? "bg-amber-500 text-black ring-4 ring-amber-500/30" :
                    "bg-slate-700 text-slate-400"
                  }`}>
                    {i < stepIdx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {/* 레이블: sm 이상에서만 표시 */}
                  <span className={`hidden sm:block text-xs whitespace-nowrap ${
                    i === stepIdx ? "text-amber-400 font-medium" : i < stepIdx ? "text-amber-500/70" : "text-slate-500"
                  }`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-5 sm:w-8 h-0.5 mx-0.5 sm:mx-1 mb-3 sm:mb-4 ${
                    i < stepIdx ? "bg-amber-500" : "bg-slate-700"
                  }`} />
                )}
              </div>
            ))}
          </div>
          {/* 모바일: 현재 스텝 레이블 */}
          <p className="sm:hidden text-center text-amber-400 text-sm font-medium mt-2">
            {stepIdx + 1}단계: {steps[stepIdx]?.label}
          </p>
        </div>

        {/* Step 1: 신청자 정보 */}
        {step === "info" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> 신청자 정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm mb-1.5 block">이름 *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1.5 block">이메일 * (인증 필수)</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="example@email.com" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1.5 block">텔레그램 핸들 (선택)</label>
                <Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm flex gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>이메일 인증은 필수입니다. 텔레그램 인증 시 추가 혜택이 제공됩니다.</span>
              </div>
              <Button onClick={() => { if (!name || !email) return toast.error("이름과 이메일을 입력해주세요."); setStep("verify"); }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                다음 단계 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: 인증 */}
        {step === "verify" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" /> 본인 인증
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 이메일 인증 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">이메일 인증</span>
                  {emailVerified && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">인증 완료</Badge>}
                </div>
                <div className="flex gap-2">
                  <Input value={email} readOnly className="bg-slate-700 border-slate-600 text-slate-300 flex-1" />
                  <Button onClick={handleSendEmailCode} disabled={emailSent || emailVerified || sendEmailCode.isPending}
                    variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 shrink-0">
                    {sendEmailCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : emailSent ? "재발송" : "코드 발송"}
                  </Button>
                </div>
                {emailSent && !emailVerified && (
                  <div className="flex gap-2">
                    <Input value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="6자리 인증 코드" className="bg-slate-700 border-slate-600 text-white flex-1" />
                    <Button onClick={handleVerifyEmail} disabled={verifyEmailCode.isPending} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      {verifyEmailCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "확인"}
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="bg-slate-700" />

              {/* 텔레그램 인증 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span className="text-white font-medium">텔레그램 인증 <span className="text-slate-400 text-sm">(선택)</span></span>
                  {telegramVerified && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">인증 완료</Badge>}
                </div>
                {telegram ? (
                  <>
                    <div className="flex gap-2">
                      <Input value={telegram} readOnly className="bg-slate-700 border-slate-600 text-slate-300 flex-1" />
                      <Button onClick={handleSendTelegramCode} disabled={telegramSent || telegramVerified || sendTelegramCode.isPending}
                        variant="outline" className="border-sky-500/50 text-sky-400 hover:bg-sky-500/10 shrink-0">
                        {sendTelegramCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : telegramSent ? "재발송" : "코드 발송"}
                      </Button>
                    </div>
                    {telegramSent && !telegramVerified && (
                      <div className="flex gap-2">
                        <Input value={telegramCode} onChange={e => setTelegramCode(e.target.value)} placeholder="6자리 인증 코드" className="bg-slate-700 border-slate-600 text-white flex-1" />
                        <Button onClick={handleVerifyTelegram} disabled={verifyTelegramCode.isPending} className="bg-sky-600 hover:bg-sky-700 shrink-0">
                          {verifyTelegramCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "확인"}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">텔레그램 핸들을 입력하지 않았습니다. 이전 단계로 돌아가서 입력할 수 있습니다.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setStep("info")} variant="outline" className="border-slate-600 text-slate-300 flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                </Button>
                <Button onClick={() => { if (!emailVerified) return toast.error("이메일 인증이 필요합니다."); setStep("upload"); }}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold flex-1">
                  다음 단계 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: 파일 업로드 */}
        {step === "upload" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" /> 자료 업로드
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm">PPT, PDF, 이미지를 업로드하면 AI가 자동으로 플랜 정보를 추출합니다.</p>

              {/* 파일 타입 안내 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Presentation className="w-6 h-6" />, label: "PPT/PPTX", desc: "권장", color: "text-orange-400" },
                  { icon: <FileText className="w-6 h-6" />, label: "PDF", desc: "지원", color: "text-red-400" },
                  { icon: <Image className="w-6 h-6" />, label: "이미지", desc: "JPG/PNG", color: "text-blue-400" },
                ].map(item => (
                  <div key={item.label} className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <div className={`${item.color} flex justify-center mb-1`}>{item.icon}</div>
                    <div className="text-white text-sm font-medium">{item.label}</div>
                    <div className="text-slate-400 text-xs">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* 업로드 영역 */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                {uploading || parsing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
                    <p className="text-amber-400">{uploading ? "파일 업로드 중..." : "AI 파싱 중..."}</p>
                  </div>
                ) : fileUrl ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                    <p className="text-green-400 font-medium">파일 업로드 완료</p>
                    <p className="text-slate-400 text-sm">다른 파일로 교체하려면 클릭하세요</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-slate-300">클릭하여 파일 선택</p>
                    <p className="text-slate-500 text-sm">PPT, PDF, JPG, PNG 지원</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileUpload} />

              {parsedPlan && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm">
                  <CheckCircle className="w-4 h-4 inline mr-1" /> AI 파싱 완료: "{parsedPlan.name ?? "플랜"}" 정보가 추출되었습니다.
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setStep("verify")} variant="outline" className="border-slate-600 text-slate-300 flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                </Button>
                <Button onClick={() => { if (!parsedPlan) return toast.error("파일을 업로드하고 AI 파싱을 완료해주세요."); setStep("preview"); }}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold flex-1">
                  다음 단계 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: 플랜 미리보기 & 수정 */}
        {step === "preview" && finalPlan && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> 플랜 정보 확인 및 수정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm">AI가 추출한 정보를 확인하고 필요 시 수정해주세요.</p>

              {/* 플랜 카드 미리보기 */}
              <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  {finalPlan.logoUrl && <img src={finalPlan.logoUrl} alt="" className="w-10 h-10 rounded-full" />}
                  <div>
                    <div className="text-white font-bold text-lg">{finalPlan.name ?? "플랜명"}</div>
                    <div className="text-slate-400 text-sm">{finalPlan.label ?? ""}</div>
                  </div>
                  <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/30">미리보기</Badge>
                </div>
                {(finalPlan.badgeLabels as string[] | undefined)?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(finalPlan.badgeLabels as string[]).map((b: string) => (
                      <Badge key={b} variant="outline" className="text-xs border-slate-600 text-slate-300">{b}</Badge>
                    ))}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">Daily Return</div>
                    <div className="text-amber-400 font-bold text-xl">{finalPlan.dailyRate ?? "0"}%</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">최소 투자</div>
                    <div className="text-white font-bold">{finalPlan.minAmount ?? "0"} USDT</div>
                  </div>
                </div>
                {finalPlan.description && (
                  <p className="text-slate-400 text-sm">{finalPlan.description}</p>
                )}
              </div>

              {/* 수정 필드 */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-300 text-sm mb-1 block">플랜명</label>
                  <Input value={finalPlan.name ?? ""} onChange={e => setFinalPlan(p => ({ ...p!, name: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-sm mb-1 block">일일 수익률 (%)</label>
                    <Input value={finalPlan.dailyRate ?? ""} onChange={e => setFinalPlan(p => ({ ...p!, dailyRate: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm mb-1 block">최소 투자 (USDT)</label>
                    <Input value={finalPlan.minAmount ?? ""} onChange={e => setFinalPlan(p => ({ ...p!, minAmount: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep("upload")} variant="outline" className="border-slate-600 text-slate-300 flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                </Button>
                <Button onClick={handleCreateSubmission} disabled={createSubmission.isPending}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold flex-1">
                  {createSubmission.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  신청 제출 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: 상장비용 납부 */}
        {step === "fee" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" /> 상장비용 납부
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-center">
                <div className="text-slate-400 text-sm mb-1">상장비용</div>
                <div className="text-amber-400 font-bold text-4xl">{settings?.listingFeeUsdt ?? "500"} USDT</div>
                <div className="text-slate-400 text-xs mt-2">신청 ID: #{submissionId}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>찬성 투표 노드 분배: <strong className="text-green-400">{100 - (settings?.platformFeePct ?? 40)}%</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>AlphaBag 운영비: <strong className="text-amber-400">{settings?.platformFeePct ?? 40}%</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>투표 기간: <strong className="text-blue-400">{settings?.votingPeriodDays ?? 7}일</strong></span>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div className="space-y-3">
                <p className="text-slate-300 text-sm">USDT를 아래 지갑으로 송금 후 트랜잭션 해시를 입력해주세요.</p>
                <div className="bg-slate-700 rounded-lg p-3 font-mono text-xs text-slate-300 break-all select-all">
                  0x742d35Cc6634C0532925a3b8D4C9B2A6f3e4A8B1
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-1.5 block">트랜잭션 해시 (TxHash)</label>
                  <Input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." className="bg-slate-700 border-slate-600 text-white font-mono text-sm" />
                </div>
              </div>

              <Button onClick={handleConfirmFee} disabled={confirmFee.isPending || !txHash}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                {confirmFee.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                납부 확인 제출
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 6: 완료 */}
        {step === "done" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-10 pb-10 text-center space-y-5">
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">신청 완료!</h2>
                <p className="text-slate-400">골든 컬렉션 상장 신청이 접수되었습니다.</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">신청 ID</span>
                  <span className="text-white font-mono">#{submissionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">이메일</span>
                  <span className="text-white">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">다음 단계</span>
                  <span className="text-amber-400">어드민 검토 → 투표 시작</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button onClick={() => window.location.href = `/my-submissions?email=${encodeURIComponent(email)}`}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  내 신청 현황 보기
                </Button>
                <Button onClick={() => window.location.href = "/"} variant="outline" className="w-full border-slate-600 text-slate-300">
                  홈으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
