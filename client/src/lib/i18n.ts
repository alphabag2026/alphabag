import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ─── Base translation (English) ───────────────────────────────────────────────
const en = {
  nav: {
    plans: "Plans", nodes: "Nodes", about: "About", dashboard: "Dashboard",
    signIn: "Sign In", getStarted: "Get Started", notices: "Notices",
  },
  hero: {
    badge: "Web3 Investment Platform",
    title1: "Invest Smart,", title2: "Earn More", title3: "with AlphaBag",
    desc: "AlphaBag provides curated Web3 investment plans and node opportunities with transparent daily returns and a powerful referral ecosystem.",
    startInvesting: "Start Investing", exploreNodes: "Explore Nodes",
    totalPlans: "Total Plans", nodeTypes: "Node Types", dailyReturns: "Daily Returns", network: "Network",
  },
  features: {
    highYield: { title: "High-Yield Plans", desc: "Choose from 17+ curated investment plans with daily returns up to 3%." },
    nodeOwnership: { title: "Node Ownership", desc: "Purchase nodes to participate in the network and earn passive income." },
    secure: { title: "Secure & Transparent", desc: "All transactions are on-chain with full transparency and security." },
  },
  plans: {
    title: "Choose Your Strategy", subtitle: "Investment Plans", viewAll: "View All",
    investNow: "Invest Now", daily: "Daily Return", minAmount: "Min. Investment",
    maxAmount: "Max. Amount", duration: "Duration", totalReturn: "Total Return",
    days: "days", investment: "Investment Plans", staking: "Staking Plans", popular: "Popular", hot: "Hot",
  },
  nodes: {
    title: "Own a Node", subtitle: "Node Ecosystem", viewAll: "View All",
    purchase: "Purchase Node", unavailable: "Unavailable", sold: "Sold", revenue: "Revenue",
    passiveIncome: { title: "Passive Income", desc: "Earn from network activity" },
    secureOwnership: { title: "Secure Ownership", desc: "On-chain node ownership" },
    exclusiveAccess: { title: "Exclusive Access", desc: "Priority investment opportunities" },
  },
  dashboard: {
    welcome: "Welcome back", overview: "Here's your portfolio overview",
    totalInvested: "Total Invested", activePlans: "Active Plans", nodeOrders: "Node Orders",
    referrals: "Referrals", myInvestments: "My Investments", newPlan: "New Plan",
    noInvestments: "No investments yet", explorePlans: "Explore Plans",
    referralProgram: "Referral Program", totalReferrals: "Total Referrals",
    shareCode: "Share Code", generateCode: "Generate Code", wallet: "Wallet",
    connectedWallet: "Connected Wallet", connectWallet: "Connect Wallet",
    myNodeOrders: "My Node Orders", buyNode: "Buy Node", noNodeOrders: "No node orders yet",
    exploreNodes: "Explore Nodes", signOut: "Sign Out",
  },
  common: {
    loading: "Loading...", active: "Active", pending: "Pending", cancelled: "Cancelled",
    confirmed: "Confirmed", copy: "Copy", copied: "Copied!", back: "Back",
    submit: "Submit", cancel: "Cancel", save: "Save", edit: "Edit", delete: "Delete",
    search: "Search", filter: "Filter", status: "Status", date: "Date", amount: "Amount", quantity: "Quantity",
  },
  wallet: {
    connect: "Connect Wallet", connected: "Wallet Connected", disconnect: "Disconnect",
    signAndLink: "Sign & Link to Account", chooseWallet: "Choose your preferred wallet to connect",
    browserExtension: "Browser extension", qrCode: "300+ wallets via QR",
    terms: "By connecting, you agree to our Terms of Service",
  },
  referrals: {
    title: "Referral Program", earnWith: "Earn with Referrals",
    desc: "Invite friends to AlphaBag and earn commissions on their investments.",
    totalReferrals: "Total Referrals", activeReferrals: "Active Referrals",
    referralCode: "Referral Code", myCode: "My Referral Code",
    generateCode: "Generate Referral Code", copyCode: "Copy Code", shareLink: "Share Link",
    howItWorks: "How It Works",
    step1: { title: "Generate Your Code", desc: "Create your unique referral code above." },
    step2: { title: "Share with Friends", desc: "Share your code or referral link with friends." },
    step3: { title: "They Sign Up & Invest", desc: "Your friends register using your referral code." },
    step4: { title: "Earn Commissions", desc: "Earn a percentage of their investment returns." },
    referredBy: "Referred By", codeApplied: "Referral Code Applied",
  },
  tickets: {
    title: "Support Tickets", newTicket: "New Ticket", createTicket: "Create Support Ticket",
    category: "Category", subject: "Subject", message: "Message", submitTicket: "Submit Ticket",
    noTickets: "No support tickets yet", createFirst: "Create First Ticket", adminReply: "Admin Reply",
    status: { open: "Open", inProgress: "In Progress", resolved: "Resolved", closed: "Closed" },
    categories: { general: "General", investment: "Investment", node: "Node", withdrawal: "Withdrawal", technical: "Technical" },
  },
  profile: {
    title: "My Profile", accountInfo: "Account Info", kycVerification: "KYC Verification",
    walletAddress: "Wallet Address", referralSystem: "Referral System",
    totalInvested: "Total Invested", totalNodes: "Total Nodes",
    kyc: {
      notSubmitted: "Not Submitted", pending: "Pending Review", approved: "Approved", rejected: "Rejected",
      submitDesc: "Submit your KYC documents to unlock full platform access.",
      pendingDesc: "Your documents are under review. This usually takes 1-3 business days.",
      approvedDesc: "Your identity has been verified. Full platform access enabled.",
      rejectedDesc: "Your KYC was rejected. Please contact support for assistance.",
    },
    enterWallet: "Enter wallet address (0x...)", update: "Update",
    referredBy: "Referred By", generateMyCode: "Generate My Code",
    enterReferralCode: "Enter referral code", apply: "Apply",
  },
  notices: { title: "Announcements", subtitle: "Latest news and updates from AlphaBag", latest: "Latest", noNotices: "No announcements yet" },
  cta: {
    title1: "Ready to Start Your", title2: "Investment Journey?",
    desc: "Join thousands of investors already earning with AlphaBag.",
    getStarted: "Get Started Free", goDashboard: "Go to Dashboard",
  },
  footer: { rights: "© 2025 AlphaBag. All rights reserved." },
  why: {
    title: "Built for Web3 Investors", subtitle: "Why Choose Us",
    globalAccess: { title: "Global Access", desc: "Invest from anywhere in the world with crypto wallets." },
    nonCustodial: { title: "Non-Custodial", desc: "Your funds remain in your control at all times." },
    analytics: { title: "Real-time Analytics", desc: "Track your portfolio performance with live dashboards." },
    referralRewards: { title: "Referral Rewards", desc: "Earn commissions by referring friends to the platform." },
    curated: { title: "Curated Projects", desc: "Only the best Binance Alpha and Web3 projects." },
    instant: { title: "Instant Setup", desc: "Connect your wallet and start investing in minutes." },
  },
};

const ko = {
  nav: { plans: "플랜", nodes: "노드", about: "소개", dashboard: "대시보드", signIn: "로그인", getStarted: "시작하기", notices: "공지사항" },
  hero: {
    badge: "Web3 투자 플랫폼", title1: "스마트하게 투자하고,", title2: "더 많이 벌어보세요", title3: "AlphaBag과 함께",
    desc: "알파백은 투명한 일일 수익률과 강력한 추천 생태계를 갖춘 엄선된 Web3 투자 플랜과 노드 기회를 제공합니다.",
    startInvesting: "투자 시작하기", exploreNodes: "노드 탐색", totalPlans: "총 플랜 수", nodeTypes: "노드 유형", dailyReturns: "일일 수익률", network: "네트워크",
  },
  features: {
    highYield: { title: "고수익 플랜", desc: "일일 최대 3% 수익률을 제공하는 17개 이상의 엄선된 투자 플랜을 선택하세요." },
    nodeOwnership: { title: "노드 소유", desc: "노드를 구매하여 네트워크에 참여하고 패시브 인컴을 얻으세요." },
    secure: { title: "안전하고 투명한", desc: "모든 거래는 완전한 투명성과 보안을 갖춘 온체인에서 이루어집니다." },
  },
  plans: { title: "전략을 선택하세요", subtitle: "투자 플랜", viewAll: "전체 보기", investNow: "지금 투자", daily: "일일 수익률", minAmount: "최소 투자금", maxAmount: "최대 금액", duration: "기간", totalReturn: "총 수익률", days: "일", investment: "투자 플랜", staking: "스테이킹 플랜", popular: "인기", hot: "인기" },
  nodes: { title: "노드를 소유하세요", subtitle: "노드 생태계", viewAll: "전체 보기", purchase: "노드 구매", unavailable: "구매 불가", sold: "판매됨", revenue: "수익", passiveIncome: { title: "패시브 인컴", desc: "네트워크 활동에서 수익 창출" }, secureOwnership: { title: "안전한 소유권", desc: "온체인 노드 소유권" }, exclusiveAccess: { title: "독점 접근", desc: "우선 투자 기회 제공" } },
  dashboard: { welcome: "환영합니다", overview: "포트폴리오 현황입니다", totalInvested: "총 투자금", activePlans: "활성 플랜", nodeOrders: "노드 주문", referrals: "추천", myInvestments: "내 투자", newPlan: "새 플랜", noInvestments: "아직 투자가 없습니다", explorePlans: "플랜 탐색", referralProgram: "추천 프로그램", totalReferrals: "총 추천 수", shareCode: "코드 공유", generateCode: "코드 생성", wallet: "지갑", connectedWallet: "연결된 지갑", connectWallet: "지갑 연결", myNodeOrders: "내 노드 주문", buyNode: "노드 구매", noNodeOrders: "아직 노드 주문이 없습니다", exploreNodes: "노드 탐색", signOut: "로그아웃" },
  common: { loading: "로딩 중...", active: "활성", pending: "대기 중", cancelled: "취소됨", confirmed: "확인됨", copy: "복사", copied: "복사됨!", back: "뒤로", submit: "제출", cancel: "취소", save: "저장", edit: "편집", delete: "삭제", search: "검색", filter: "필터", status: "상태", date: "날짜", amount: "금액", quantity: "수량" },
  wallet: { connect: "지갑 연결", connected: "지갑 연결됨", disconnect: "연결 해제", signAndLink: "서명 및 계정 연결", chooseWallet: "연결할 지갑을 선택하세요", browserExtension: "브라우저 확장 프로그램", qrCode: "QR코드로 300+ 지갑 연결", terms: "연결하면 서비스 약관에 동의하는 것입니다" },
  referrals: { title: "추천 프로그램", earnWith: "추천으로 수익 창출", desc: "친구를 알파백에 초대하고 투자 수익의 일부를 받으세요.", totalReferrals: "총 추천 수", activeReferrals: "활성 추천", referralCode: "추천 코드", myCode: "내 추천 코드", generateCode: "추천 코드 생성", copyCode: "코드 복사", shareLink: "링크 공유", howItWorks: "작동 방식", step1: { title: "코드 생성", desc: "위에서 고유한 추천 코드를 만드세요." }, step2: { title: "친구와 공유", desc: "코드나 추천 링크를 친구에게 공유하세요." }, step3: { title: "가입 및 투자", desc: "친구가 추천 코드로 등록합니다." }, step4: { title: "수익 획득", desc: "친구의 투자 수익 일부를 받으세요." }, referredBy: "추천인", codeApplied: "추천 코드 적용됨" },
  tickets: { title: "지원 티켓", newTicket: "새 티켓", createTicket: "지원 티켓 생성", category: "카테고리", subject: "제목", message: "내용", submitTicket: "티켓 제출", noTickets: "아직 지원 티켓이 없습니다", createFirst: "첫 티켓 만들기", adminReply: "관리자 답변", status: { open: "열림", inProgress: "처리 중", resolved: "해결됨", closed: "닫힘" }, categories: { general: "일반", investment: "투자", node: "노드", withdrawal: "출금", technical: "기술" } },
  profile: { title: "내 프로필", accountInfo: "계정 정보", kycVerification: "KYC 인증", walletAddress: "지갑 주소", referralSystem: "추천 시스템", totalInvested: "총 투자금", totalNodes: "총 노드 수", kyc: { notSubmitted: "미제출", pending: "검토 중", approved: "승인됨", rejected: "거부됨", submitDesc: "KYC 서류를 제출하여 전체 플랫폼 접근 권한을 잠금 해제하세요.", pendingDesc: "서류가 검토 중입니다. 보통 1-3 영업일이 소요됩니다.", approvedDesc: "신원이 확인되었습니다. 전체 플랫폼 접근이 활성화되었습니다.", rejectedDesc: "KYC가 거부되었습니다. 지원팀에 문의하세요." }, enterWallet: "지갑 주소 입력 (0x...)", update: "업데이트", referredBy: "추천인", generateMyCode: "내 코드 생성", enterReferralCode: "추천 코드 입력", apply: "적용" },
  notices: { title: "공지사항", subtitle: "알파백의 최신 소식 및 업데이트", latest: "최신", noNotices: "아직 공지사항이 없습니다" },
  cta: { title1: "투자 여정을", title2: "시작할 준비가 되셨나요?", desc: "이미 알파백으로 수익을 올리고 있는 수천 명의 투자자와 함께하세요.", getStarted: "무료로 시작하기", goDashboard: "대시보드로 이동" },
  footer: { rights: "© 2025 AlphaBag. 모든 권리 보유." },
  why: { title: "Web3 투자자를 위해 만들어졌습니다", subtitle: "왜 우리를 선택해야 하나요", globalAccess: { title: "글로벌 접근", desc: "암호화폐 지갑으로 전 세계 어디서나 투자하세요." }, nonCustodial: { title: "비수탁형", desc: "자금은 항상 본인이 관리합니다." }, analytics: { title: "실시간 분석", desc: "라이브 대시보드로 포트폴리오 성과를 추적하세요." }, referralRewards: { title: "추천 보상", desc: "친구를 추천하여 수익을 얻으세요." }, curated: { title: "엄선된 프로젝트", desc: "최고의 Binance Alpha 및 Web3 프로젝트만 제공합니다." }, instant: { title: "즉시 설정", desc: "지갑을 연결하고 몇 분 안에 투자를 시작하세요." } },
};

const zh = {
  nav: { plans: "计划", nodes: "节点", about: "关于", dashboard: "仪表板", signIn: "登录", getStarted: "开始使用", notices: "公告" },
  hero: { badge: "Web3 投资平台", title1: "智慧投资，", title2: "赚取更多", title3: "与 AlphaBag 一起", desc: "AlphaBag 提供精选的 Web3 投资计划和节点机会，具有透明的每日收益和强大的推荐生态系统。", startInvesting: "开始投资", exploreNodes: "探索节点", totalPlans: "总计划数", nodeTypes: "节点类型", dailyReturns: "每日收益", network: "网络" },
  features: { highYield: { title: "高收益计划", desc: "从 17+ 个精选投资计划中选择，每日收益高达 3%。" }, nodeOwnership: { title: "节点所有权", desc: "购买节点参与网络并赚取被动收入。" }, secure: { title: "安全透明", desc: "所有交易均在链上进行，具有完全透明性和安全性。" } },
  plans: { title: "选择您的策略", subtitle: "投资计划", viewAll: "查看全部", investNow: "立即投资", daily: "每日收益", minAmount: "最低投资", maxAmount: "最高金额", duration: "期限", totalReturn: "总收益", days: "天", investment: "投资计划", staking: "质押计划", popular: "热门", hot: "热门" },
  nodes: { title: "拥有节点", subtitle: "节点生态系统", viewAll: "查看全部", purchase: "购买节点", unavailable: "不可用", sold: "已售出", revenue: "收益", passiveIncome: { title: "被动收入", desc: "从网络活动中赚取收益" }, secureOwnership: { title: "安全所有权", desc: "链上节点所有权" }, exclusiveAccess: { title: "独家访问", desc: "优先投资机会" } },
  dashboard: { welcome: "欢迎回来", overview: "这是您的投资组合概览", totalInvested: "总投资额", activePlans: "活跃计划", nodeOrders: "节点订单", referrals: "推荐", myInvestments: "我的投资", newPlan: "新计划", noInvestments: "暂无投资", explorePlans: "探索计划", referralProgram: "推荐计划", totalReferrals: "总推荐数", shareCode: "分享代码", generateCode: "生成代码", wallet: "钱包", connectedWallet: "已连接钱包", connectWallet: "连接钱包", myNodeOrders: "我的节点订单", buyNode: "购买节点", noNodeOrders: "暂无节点订单", exploreNodes: "探索节点", signOut: "退出登录" },
  common: { loading: "加载中...", active: "活跃", pending: "待处理", cancelled: "已取消", confirmed: "已确认", copy: "复制", copied: "已复制！", back: "返回", submit: "提交", cancel: "取消", save: "保存", edit: "编辑", delete: "删除", search: "搜索", filter: "筛选", status: "状态", date: "日期", amount: "金额", quantity: "数量" },
  wallet: { connect: "连接钱包", connected: "钱包已连接", disconnect: "断开连接", signAndLink: "签名并关联账户", chooseWallet: "选择您偏好的钱包进行连接", browserExtension: "浏览器扩展", qrCode: "通过二维码连接 300+ 钱包", terms: "连接即表示您同意我们的服务条款" },
  referrals: { title: "推荐计划", earnWith: "通过推荐赚取收益", desc: "邀请朋友加入 AlphaBag，赚取他们投资的佣金。", totalReferrals: "总推荐数", activeReferrals: "活跃推荐", referralCode: "推荐代码", myCode: "我的推荐代码", generateCode: "生成推荐代码", copyCode: "复制代码", shareLink: "分享链接", howItWorks: "如何运作", step1: { title: "生成您的代码", desc: "在上方创建您的唯一推荐代码。" }, step2: { title: "与朋友分享", desc: "将您的代码或推荐链接分享给朋友。" }, step3: { title: "他们注册并投资", desc: "您的朋友使用您的推荐代码注册。" }, step4: { title: "赚取佣金", desc: "赚取他们投资收益的一定比例。" }, referredBy: "推荐人", codeApplied: "推荐代码已应用" },
  tickets: { title: "支持工单", newTicket: "新建工单", createTicket: "创建支持工单", category: "类别", subject: "主题", message: "内容", submitTicket: "提交工单", noTickets: "暂无支持工单", createFirst: "创建第一个工单", adminReply: "管理员回复", status: { open: "开放", inProgress: "处理中", resolved: "已解决", closed: "已关闭" }, categories: { general: "一般", investment: "投资", node: "节点", withdrawal: "提款", technical: "技术" } },
  profile: { title: "我的资料", accountInfo: "账户信息", kycVerification: "KYC 验证", walletAddress: "钱包地址", referralSystem: "推荐系统", totalInvested: "总投资额", totalNodes: "总节点数", kyc: { notSubmitted: "未提交", pending: "审核中", approved: "已批准", rejected: "已拒绝", submitDesc: "提交您的 KYC 文件以解锁完整平台访问权限。", pendingDesc: "您的文件正在审核中，通常需要 1-3 个工作日。", approvedDesc: "您的身份已验证，已启用完整平台访问权限。", rejectedDesc: "您的 KYC 被拒绝，请联系支持团队。" }, enterWallet: "输入钱包地址 (0x...)", update: "更新", referredBy: "推荐人", generateMyCode: "生成我的代码", enterReferralCode: "输入推荐代码", apply: "应用" },
  notices: { title: "公告", subtitle: "AlphaBag 的最新消息和更新", latest: "最新", noNotices: "暂无公告" },
  cta: { title1: "准备好开始您的", title2: "投资之旅了吗？", desc: "加入已经通过 AlphaBag 获利的数千名投资者。", getStarted: "免费开始", goDashboard: "前往仪表板" },
  footer: { rights: "© 2025 AlphaBag. 保留所有权利。" },
  why: { title: "为 Web3 投资者而建", subtitle: "为什么选择我们", globalAccess: { title: "全球访问", desc: "通过加密钱包在世界任何地方投资。" }, nonCustodial: { title: "非托管", desc: "您的资金始终由您自己控制。" }, analytics: { title: "实时分析", desc: "通过实时仪表板跟踪您的投资组合表现。" }, referralRewards: { title: "推荐奖励", desc: "通过推荐朋友赚取佣金。" }, curated: { title: "精选项目", desc: "只提供最优质的 Binance Alpha 和 Web3 项目。" }, instant: { title: "即时设置", desc: "连接钱包，几分钟内开始投资。" } },
};

// ─── Additional languages (key translations) ─────────────────────────────────
const ja = {
  nav: { plans: "プラン", nodes: "ノード", about: "概要", dashboard: "ダッシュボード", signIn: "ログイン", getStarted: "始める", notices: "お知らせ" },
  hero: { badge: "Web3 投資プラットフォーム", title1: "スマートに投資し、", title2: "より多く稼ぐ", title3: "AlphaBag と共に", desc: "AlphaBag は透明な日次リターンと強力な紹介エコシステムを持つ厳選された Web3 投資プランとノード機会を提供します。", startInvesting: "投資を始める", exploreNodes: "ノードを探索", totalPlans: "総プラン数", nodeTypes: "ノードタイプ", dailyReturns: "日次リターン", network: "ネットワーク" },
  features: { highYield: { title: "高利回りプラン", desc: "日次最大3%のリターンを持つ17以上の厳選投資プランから選択。" }, nodeOwnership: { title: "ノード所有", desc: "ノードを購入してネットワークに参加し、パッシブインカムを獲得。" }, secure: { title: "安全で透明", desc: "すべての取引は完全な透明性とセキュリティを持つオンチェーンで行われます。" } },
  plans: { title: "戦略を選択", subtitle: "投資プラン", viewAll: "すべて見る", investNow: "今すぐ投資", daily: "日次リターン", minAmount: "最低投資額", maxAmount: "最大金額", duration: "期間", totalReturn: "総リターン", days: "日", investment: "投資プラン", staking: "ステーキングプラン", popular: "人気", hot: "人気" },
  nodes: { title: "ノードを所有", subtitle: "ノードエコシステム", viewAll: "すべて見る", purchase: "ノード購入", unavailable: "利用不可", sold: "売り切れ", revenue: "収益", passiveIncome: { title: "パッシブインカム", desc: "ネットワーク活動から収益を獲得" }, secureOwnership: { title: "安全な所有権", desc: "オンチェーンノード所有権" }, exclusiveAccess: { title: "独占アクセス", desc: "優先投資機会" } },
  dashboard: { welcome: "おかえりなさい", overview: "ポートフォリオの概要", totalInvested: "総投資額", activePlans: "アクティブプラン", nodeOrders: "ノード注文", referrals: "紹介", myInvestments: "私の投資", newPlan: "新プラン", noInvestments: "まだ投資がありません", explorePlans: "プランを探索", referralProgram: "紹介プログラム", totalReferrals: "総紹介数", shareCode: "コードを共有", generateCode: "コードを生成", wallet: "ウォレット", connectedWallet: "接続済みウォレット", connectWallet: "ウォレットを接続", myNodeOrders: "私のノード注文", buyNode: "ノードを購入", noNodeOrders: "まだノード注文がありません", exploreNodes: "ノードを探索", signOut: "サインアウト" },
  common: { loading: "読み込み中...", active: "アクティブ", pending: "保留中", cancelled: "キャンセル済み", confirmed: "確認済み", copy: "コピー", copied: "コピーしました！", back: "戻る", submit: "送信", cancel: "キャンセル", save: "保存", edit: "編集", delete: "削除", search: "検索", filter: "フィルター", status: "ステータス", date: "日付", amount: "金額", quantity: "数量" },
  wallet: { connect: "ウォレットを接続", connected: "ウォレット接続済み", disconnect: "切断", signAndLink: "署名してアカウントにリンク", chooseWallet: "接続するウォレットを選択", browserExtension: "ブラウザ拡張機能", qrCode: "QRコードで300+ウォレット", terms: "接続することで利用規約に同意します" },
  referrals: { title: "紹介プログラム", earnWith: "紹介で収益を得る", desc: "友達を AlphaBag に招待して投資収益のコミッションを獲得。", totalReferrals: "総紹介数", activeReferrals: "アクティブ紹介", referralCode: "紹介コード", myCode: "私の紹介コード", generateCode: "紹介コードを生成", copyCode: "コードをコピー", shareLink: "リンクを共有", howItWorks: "仕組み", step1: { title: "コードを生成", desc: "上記でユニークな紹介コードを作成。" }, step2: { title: "友達と共有", desc: "コードや紹介リンクを友達に共有。" }, step3: { title: "登録して投資", desc: "友達が紹介コードで登録。" }, step4: { title: "コミッションを獲得", desc: "投資収益の一定割合を獲得。" }, referredBy: "紹介者", codeApplied: "紹介コード適用済み" },
  tickets: { title: "サポートチケット", newTicket: "新規チケット", createTicket: "サポートチケットを作成", category: "カテゴリ", subject: "件名", message: "メッセージ", submitTicket: "チケットを送信", noTickets: "まだサポートチケットがありません", createFirst: "最初のチケットを作成", adminReply: "管理者の返信", status: { open: "オープン", inProgress: "対応中", resolved: "解決済み", closed: "クローズ" }, categories: { general: "一般", investment: "投資", node: "ノード", withdrawal: "出金", technical: "技術" } },
  profile: { title: "マイプロフィール", accountInfo: "アカウント情報", kycVerification: "KYC 認証", walletAddress: "ウォレットアドレス", referralSystem: "紹介システム", totalInvested: "総投資額", totalNodes: "総ノード数", kyc: { notSubmitted: "未提出", pending: "審査中", approved: "承認済み", rejected: "却下", submitDesc: "KYC書類を提出してフルアクセスを解除。", pendingDesc: "書類審査中です。通常1-3営業日かかります。", approvedDesc: "身元確認済み。フルアクセスが有効です。", rejectedDesc: "KYCが却下されました。サポートにお問い合わせください。" }, enterWallet: "ウォレットアドレスを入力 (0x...)", update: "更新", referredBy: "紹介者", generateMyCode: "マイコードを生成", enterReferralCode: "紹介コードを入力", apply: "適用" },
  notices: { title: "お知らせ", subtitle: "AlphaBag の最新ニュースとアップデート", latest: "最新", noNotices: "まだお知らせがありません" },
  cta: { title1: "投資の旅を", title2: "始める準備はできていますか？", desc: "すでに AlphaBag で収益を上げている数千人の投資家に参加しましょう。", getStarted: "無料で始める", goDashboard: "ダッシュボードへ" },
  footer: { rights: "© 2025 AlphaBag. 全著作権所有。" },
  why: { title: "Web3 投資家のために作られました", subtitle: "なぜ私たちを選ぶのか", globalAccess: { title: "グローバルアクセス", desc: "暗号ウォレットで世界中どこからでも投資。" }, nonCustodial: { title: "非カストディアル", desc: "資金は常にあなたの管理下にあります。" }, analytics: { title: "リアルタイム分析", desc: "ライブダッシュボードでポートフォリオを追跡。" }, referralRewards: { title: "紹介報酬", desc: "友達を紹介してコミッションを獲得。" }, curated: { title: "厳選プロジェクト", desc: "最高の Binance Alpha と Web3 プロジェクトのみ。" }, instant: { title: "即時設定", desc: "ウォレットを接続して数分で投資開始。" } },
};

// Simplified translations for additional languages
const makeSimple = (
  navPlans: string, navNodes: string, navDash: string, navSignIn: string, navStart: string, navNotices: string,
  heroBadge: string, heroTitle1: string, heroTitle2: string, heroTitle3: string,
  heroDesc: string, heroStart: string, heroExplore: string,
  planTitle: string, planViewAll: string, planInvest: string,
  nodeTitle: string, nodePurchase: string,
  dashWelcome: string, dashConnect: string,
  commonLoading: string, commonActive: string, commonSearch: string,
  walletConnect: string, walletConnected: string,
  ctaTitle1: string, ctaTitle2: string, ctaStart: string,
  footerRights: string
) => ({
  nav: { plans: navPlans, nodes: navNodes, about: navNodes, dashboard: navDash, signIn: navSignIn, getStarted: navStart, notices: navNotices },
  hero: { badge: heroBadge, title1: heroTitle1, title2: heroTitle2, title3: heroTitle3, desc: heroDesc, startInvesting: heroStart, exploreNodes: heroExplore, totalPlans: "Plans", nodeTypes: "Nodes", dailyReturns: "Returns", network: "Network" },
  features: { highYield: { title: planTitle, desc: heroDesc }, nodeOwnership: { title: nodeTitle, desc: heroDesc }, secure: { title: "Secure", desc: heroDesc } },
  plans: { title: planTitle, subtitle: planTitle, viewAll: planViewAll, investNow: planInvest, daily: "Daily", minAmount: "Min", maxAmount: "Max", duration: "Duration", totalReturn: "Return", days: "days", investment: planTitle, staking: "Staking", popular: "Popular", hot: "Hot" },
  nodes: { title: nodeTitle, subtitle: nodeTitle, viewAll: planViewAll, purchase: nodePurchase, unavailable: "N/A", sold: "Sold", revenue: "Revenue", passiveIncome: { title: "Income", desc: "" }, secureOwnership: { title: "Secure", desc: "" }, exclusiveAccess: { title: "Access", desc: "" } },
  dashboard: { welcome: dashWelcome, overview: "", totalInvested: "Invested", activePlans: "Plans", nodeOrders: "Nodes", referrals: "Refs", myInvestments: "Investments", newPlan: "New", noInvestments: "-", explorePlans: planViewAll, referralProgram: "Referral", totalReferrals: "Referrals", shareCode: "Share", generateCode: "Generate", wallet: "Wallet", connectedWallet: dashConnect, connectWallet: walletConnect, myNodeOrders: "Orders", buyNode: nodePurchase, noNodeOrders: "-", exploreNodes: heroExplore, signOut: navSignIn },
  common: { loading: commonLoading, active: commonActive, pending: "Pending", cancelled: "Cancelled", confirmed: "Confirmed", copy: "Copy", copied: "Copied!", back: "Back", submit: "Submit", cancel: "Cancel", save: "Save", edit: "Edit", delete: "Delete", search: commonSearch, filter: "Filter", status: "Status", date: "Date", amount: "Amount", quantity: "Qty" },
  wallet: { connect: walletConnect, connected: walletConnected, disconnect: "Disconnect", signAndLink: "Sign & Link", chooseWallet: walletConnect, browserExtension: "Extension", qrCode: "QR Code", terms: "" },
  referrals: { title: "Referral", earnWith: "Earn", desc: heroDesc, totalReferrals: "Total", activeReferrals: "Active", referralCode: "Code", myCode: "My Code", generateCode: "Generate", copyCode: "Copy", shareLink: "Share", howItWorks: "How", step1: { title: "1", desc: "" }, step2: { title: "2", desc: "" }, step3: { title: "3", desc: "" }, step4: { title: "4", desc: "" }, referredBy: "By", codeApplied: "Applied" },
  tickets: { title: "Support", newTicket: "New", createTicket: "Create", category: "Category", subject: "Subject", message: "Message", submitTicket: "Submit", noTickets: "-", createFirst: "Create", adminReply: "Reply", status: { open: "Open", inProgress: "In Progress", resolved: "Resolved", closed: "Closed" }, categories: { general: "General", investment: "Investment", node: "Node", withdrawal: "Withdrawal", technical: "Technical" } },
  profile: { title: "Profile", accountInfo: "Account", kycVerification: "KYC", walletAddress: "Wallet", referralSystem: "Referral", totalInvested: "Invested", totalNodes: "Nodes", kyc: { notSubmitted: "Not Submitted", pending: "Pending", approved: "Approved", rejected: "Rejected", submitDesc: "", pendingDesc: "", approvedDesc: "", rejectedDesc: "" }, enterWallet: "0x...", update: "Update", referredBy: "By", generateMyCode: "Generate", enterReferralCode: "Code", apply: "Apply" },
  notices: { title: navNotices, subtitle: "", latest: "Latest", noNotices: "-" },
  cta: { title1: ctaTitle1, title2: ctaTitle2, desc: heroDesc, getStarted: ctaStart, goDashboard: navDash },
  footer: { rights: footerRights },
  why: { title: heroBadge, subtitle: "", globalAccess: { title: "Global", desc: "" }, nonCustodial: { title: "Secure", desc: "" }, analytics: { title: "Analytics", desc: "" }, referralRewards: { title: "Rewards", desc: "" }, curated: { title: "Curated", desc: "" }, instant: { title: "Instant", desc: "" } },
});

const resources = {
  en: { translation: en },
  ko: { translation: ko },
  zh: { translation: zh },
  ja: { translation: ja },
  // Vietnamese
  vi: { translation: makeSimple("Kế hoạch", "Nút", "Bảng điều khiển", "Đăng nhập", "Bắt đầu", "Thông báo", "Nền tảng đầu tư Web3", "Đầu tư thông minh,", "Kiếm nhiều hơn", "với AlphaBag", "AlphaBag cung cấp các kế hoạch đầu tư Web3 được tuyển chọn với lợi nhuận hàng ngày minh bạch.", "Bắt đầu đầu tư", "Khám phá nút", "Kế hoạch đầu tư", "Xem tất cả", "Đầu tư ngay", "Sở hữu nút", "Mua nút", "Chào mừng trở lại", "Ví đã kết nối", "Đang tải...", "Hoạt động", "Tìm kiếm", "Kết nối ví", "Ví đã kết nối", "Sẵn sàng bắt đầu", "hành trình đầu tư?", "Bắt đầu miễn phí", "© 2025 AlphaBag. Bảo lưu mọi quyền.") },
  // Thai
  th: { translation: makeSimple("แผน", "โหนด", "แดชบอร์ด", "เข้าสู่ระบบ", "เริ่มต้น", "ประกาศ", "แพลตฟอร์มการลงทุน Web3", "ลงทุนอย่างชาญฉลาด", "รับผลตอบแทนมากขึ้น", "กับ AlphaBag", "AlphaBag มอบแผนการลงทุน Web3 ที่คัดสรรแล้วพร้อมผลตอบแทนรายวันที่โปร่งใส", "เริ่มลงทุน", "สำรวจโหนด", "แผนการลงทุน", "ดูทั้งหมด", "ลงทุนเลย", "เป็นเจ้าของโหนด", "ซื้อโหนด", "ยินดีต้อนรับกลับ", "กระเป๋าเงินที่เชื่อมต่อ", "กำลังโหลด...", "ใช้งานอยู่", "ค้นหา", "เชื่อมต่อกระเป๋าเงิน", "กระเป๋าเงินเชื่อมต่อแล้ว", "พร้อมที่จะเริ่มต้น", "การเดินทางการลงทุน?", "เริ่มต้นฟรี", "© 2025 AlphaBag. สงวนลิขสิทธิ์ทั้งหมด.") },
  // Indonesian
  id: { translation: makeSimple("Rencana", "Node", "Dasbor", "Masuk", "Mulai", "Pengumuman", "Platform Investasi Web3", "Investasi Cerdas,", "Dapatkan Lebih Banyak", "dengan AlphaBag", "AlphaBag menyediakan rencana investasi Web3 yang dikurasi dengan imbal hasil harian yang transparan.", "Mulai Berinvestasi", "Jelajahi Node", "Rencana Investasi", "Lihat Semua", "Investasi Sekarang", "Miliki Node", "Beli Node", "Selamat datang kembali", "Dompet Terhubung", "Memuat...", "Aktif", "Cari", "Hubungkan Dompet", "Dompet Terhubung", "Siap Memulai", "Perjalanan Investasi?", "Mulai Gratis", "© 2025 AlphaBag. Hak cipta dilindungi.") },
  // Malay
  ms: { translation: makeSimple("Pelan", "Nod", "Papan Pemuka", "Log Masuk", "Mulakan", "Pengumuman", "Platform Pelaburan Web3", "Labur dengan Bijak,", "Jana Lebih Banyak", "dengan AlphaBag", "AlphaBag menyediakan pelan pelaburan Web3 yang terpilih dengan pulangan harian yang telus.", "Mula Melabur", "Terokai Nod", "Pelan Pelaburan", "Lihat Semua", "Labur Sekarang", "Miliki Nod", "Beli Nod", "Selamat kembali", "Dompet Disambung", "Memuatkan...", "Aktif", "Cari", "Sambung Dompet", "Dompet Disambung", "Bersedia untuk Memulakan", "Perjalanan Pelaburan?", "Mulakan Percuma", "© 2025 AlphaBag. Hak cipta terpelihara.") },
  // Russian
  ru: { translation: makeSimple("Планы", "Узлы", "Панель управления", "Войти", "Начать", "Объявления", "Платформа инвестиций Web3", "Инвестируйте умно,", "Зарабатывайте больше", "с AlphaBag", "AlphaBag предоставляет отобранные инвестиционные планы Web3 с прозрачной ежедневной доходностью.", "Начать инвестировать", "Изучить узлы", "Инвестиционные планы", "Посмотреть все", "Инвестировать сейчас", "Владеть узлом", "Купить узел", "Добро пожаловать", "Кошелёк подключён", "Загрузка...", "Активный", "Поиск", "Подключить кошелёк", "Кошелёк подключён", "Готовы начать", "инвестиционный путь?", "Начать бесплатно", "© 2025 AlphaBag. Все права защищены.") },
  // Arabic
  ar: { translation: makeSimple("الخطط", "العقد", "لوحة التحكم", "تسجيل الدخول", "ابدأ", "الإعلانات", "منصة استثمار Web3", "استثمر بذكاء،", "اكسب أكثر", "مع AlphaBag", "يوفر AlphaBag خطط استثمار Web3 منتقاة مع عوائد يومية شفافة.", "ابدأ الاستثمار", "استكشف العقد", "خطط الاستثمار", "عرض الكل", "استثمر الآن", "امتلك عقدة", "شراء عقدة", "مرحباً بعودتك", "المحفظة متصلة", "جارٍ التحميل...", "نشط", "بحث", "ربط المحفظة", "المحفظة متصلة", "هل أنت مستعد للبدء", "رحلة الاستثمار؟", "ابدأ مجاناً", "© 2025 AlphaBag. جميع الحقوق محفوظة.") },
  // Spanish
  es: { translation: makeSimple("Planes", "Nodos", "Panel", "Iniciar sesión", "Comenzar", "Anuncios", "Plataforma de Inversión Web3", "Invierte con inteligencia,", "Gana más", "con AlphaBag", "AlphaBag ofrece planes de inversión Web3 seleccionados con rendimientos diarios transparentes.", "Comenzar a invertir", "Explorar nodos", "Planes de inversión", "Ver todo", "Invertir ahora", "Poseer un nodo", "Comprar nodo", "Bienvenido de vuelta", "Billetera conectada", "Cargando...", "Activo", "Buscar", "Conectar billetera", "Billetera conectada", "¿Listo para comenzar", "tu viaje de inversión?", "Comenzar gratis", "© 2025 AlphaBag. Todos los derechos reservados.") },
  // Portuguese
  pt: { translation: makeSimple("Planos", "Nós", "Painel", "Entrar", "Começar", "Anúncios", "Plataforma de Investimento Web3", "Invista com inteligência,", "Ganhe mais", "com AlphaBag", "AlphaBag oferece planos de investimento Web3 selecionados com retornos diários transparentes.", "Começar a investir", "Explorar nós", "Planos de investimento", "Ver tudo", "Investir agora", "Possuir um nó", "Comprar nó", "Bem-vindo de volta", "Carteira conectada", "Carregando...", "Ativo", "Pesquisar", "Conectar carteira", "Carteira conectada", "Pronto para começar", "sua jornada de investimento?", "Começar grátis", "© 2025 AlphaBag. Todos os direitos reservados.") },
  // French
  fr: { translation: makeSimple("Plans", "Nœuds", "Tableau de bord", "Se connecter", "Commencer", "Annonces", "Plateforme d'investissement Web3", "Investissez intelligemment,", "Gagnez plus", "avec AlphaBag", "AlphaBag propose des plans d'investissement Web3 sélectionnés avec des rendements quotidiens transparents.", "Commencer à investir", "Explorer les nœuds", "Plans d'investissement", "Voir tout", "Investir maintenant", "Posséder un nœud", "Acheter un nœud", "Bienvenue", "Portefeuille connecté", "Chargement...", "Actif", "Rechercher", "Connecter le portefeuille", "Portefeuille connecté", "Prêt à commencer", "votre parcours d'investissement?", "Commencer gratuitement", "© 2025 AlphaBag. Tous droits réservés.") },
  // German
  de: { translation: makeSimple("Pläne", "Knoten", "Dashboard", "Anmelden", "Starten", "Ankündigungen", "Web3-Investitionsplattform", "Intelligent investieren,", "Mehr verdienen", "mit AlphaBag", "AlphaBag bietet ausgewählte Web3-Investitionspläne mit transparenten täglichen Renditen.", "Mit dem Investieren beginnen", "Knoten erkunden", "Investitionspläne", "Alle anzeigen", "Jetzt investieren", "Knoten besitzen", "Knoten kaufen", "Willkommen zurück", "Wallet verbunden", "Wird geladen...", "Aktiv", "Suchen", "Wallet verbinden", "Wallet verbunden", "Bereit anzufangen", "Ihre Investitionsreise?", "Kostenlos starten", "© 2025 AlphaBag. Alle Rechte vorbehalten.") },
  // Italian
  it: { translation: makeSimple("Piani", "Nodi", "Dashboard", "Accedi", "Inizia", "Annunci", "Piattaforma di investimento Web3", "Investi in modo intelligente,", "Guadagna di più", "con AlphaBag", "AlphaBag offre piani di investimento Web3 selezionati con rendimenti giornalieri trasparenti.", "Inizia a investire", "Esplora i nodi", "Piani di investimento", "Vedi tutto", "Investi ora", "Possiedi un nodo", "Acquista nodo", "Bentornato", "Portafoglio connesso", "Caricamento...", "Attivo", "Cerca", "Connetti portafoglio", "Portafoglio connesso", "Pronto per iniziare", "il tuo percorso di investimento?", "Inizia gratis", "© 2025 AlphaBag. Tutti i diritti riservati.") },
  // Turkish
  tr: { translation: makeSimple("Planlar", "Düğümler", "Gösterge Paneli", "Giriş Yap", "Başla", "Duyurular", "Web3 Yatırım Platformu", "Akıllıca Yatırım Yapın,", "Daha Fazla Kazanın", "AlphaBag ile", "AlphaBag, şeffaf günlük getirilerle seçilmiş Web3 yatırım planları ve düğüm fırsatları sunar.", "Yatırıma Başla", "Düğümleri Keşfet", "Yatırım Planları", "Tümünü Gör", "Şimdi Yatırım Yap", "Düğüm Sahip Ol", "Düğüm Satın Al", "Hoş geldiniz", "Cüzdan Bağlı", "Yükleniyor...", "Aktif", "Ara", "Cüzdan Bağla", "Cüzdan Bağlı", "Başlamaya Hazır mısınız", "Yatırım Yolculuğunuz?", "Ücretsiz Başla", "© 2025 AlphaBag. Tüm hakları saklıdır.") },
  // Hindi
  hi: { translation: makeSimple("योजनाएं", "नोड्स", "डैशबोर्ड", "साइन इन", "शुरू करें", "घोषणाएं", "Web3 निवेश प्लेटफ़ॉर्म", "स्मार्ट निवेश करें,", "अधिक कमाएं", "AlphaBag के साथ", "AlphaBag पारदर्शी दैनिक रिटर्न के साथ क्यूरेटेड Web3 निवेश योजनाएं प्रदान करता है।", "निवेश शुरू करें", "नोड्स एक्सप्लोर करें", "निवेश योजनाएं", "सभी देखें", "अभी निवेश करें", "नोड स्वामित्व", "नोड खरीदें", "वापस स्वागत है", "वॉलेट जुड़ा है", "लोड हो रहा है...", "सक्रिय", "खोजें", "वॉलेट कनेक्ट करें", "वॉलेट जुड़ा है", "शुरू करने के लिए तैयार हैं", "निवेश यात्रा?", "मुफ़्त शुरू करें", "© 2025 AlphaBag. सर्वाधिकार सुरक्षित।") },
  // Polish
  pl: { translation: makeSimple("Plany", "Węzły", "Panel", "Zaloguj się", "Zacznij", "Ogłoszenia", "Platforma inwestycyjna Web3", "Inwestuj mądrze,", "Zarabiaj więcej", "z AlphaBag", "AlphaBag oferuje wyselekcjonowane plany inwestycyjne Web3 z przejrzystymi dziennymi zwrotami.", "Zacznij inwestować", "Odkryj węzły", "Plany inwestycyjne", "Zobacz wszystko", "Inwestuj teraz", "Posiadaj węzeł", "Kup węzeł", "Witaj z powrotem", "Portfel połączony", "Ładowanie...", "Aktywny", "Szukaj", "Połącz portfel", "Portfel połączony", "Gotowy do rozpoczęcia", "podróży inwestycyjnej?", "Zacznij za darmo", "© 2025 AlphaBag. Wszelkie prawa zastrzeżone.") },
  // Dutch
  nl: { translation: makeSimple("Plannen", "Knooppunten", "Dashboard", "Inloggen", "Beginnen", "Aankondigingen", "Web3 Investeringsplatform", "Investeer slim,", "Verdien meer", "met AlphaBag", "AlphaBag biedt geselecteerde Web3-investeringsplannen met transparante dagelijkse rendementen.", "Begin met investeren", "Verken knooppunten", "Investeringsplannen", "Alles bekijken", "Nu investeren", "Bezit een knooppunt", "Knooppunt kopen", "Welkom terug", "Portemonnee verbonden", "Laden...", "Actief", "Zoeken", "Portemonnee verbinden", "Portemonnee verbonden", "Klaar om te beginnen", "investeringsreis?", "Gratis beginnen", "© 2025 AlphaBag. Alle rechten voorbehouden.") },
  // Ukrainian
  uk: { translation: makeSimple("Плани", "Вузли", "Панель", "Увійти", "Почати", "Оголошення", "Платформа інвестицій Web3", "Інвестуйте розумно,", "Заробляйте більше", "з AlphaBag", "AlphaBag надає відібрані інвестиційні плани Web3 з прозрачною щоденною прибутковістю.", "Почати інвестувати", "Дослідити вузли", "Інвестиційні плани", "Переглянути все", "Інвестувати зараз", "Мати вузол", "Купити вузол", "Ласкаво просимо", "Гаманець підключено", "Завантаження...", "Активний", "Пошук", "Підключити гаманець", "Гаманець підключено", "Готові почати", "інвестиційний шлях?", "Почати безкоштовно", "© 2025 AlphaBag. Всі права захищені.") },
  // Filipino
  tl: { translation: makeSimple("Mga Plano", "Mga Node", "Dashboard", "Mag-sign in", "Magsimula", "Mga Anunsyo", "Web3 Investment Platform", "Mag-invest nang matalino,", "Kumita ng higit pa", "kasama ang AlphaBag", "Nagbibigay ang AlphaBag ng mga piniling Web3 investment plan na may transparent na araw-araw na kita.", "Magsimulang mag-invest", "I-explore ang mga node", "Mga Investment Plan", "Tingnan lahat", "Mag-invest ngayon", "Magmay-ari ng node", "Bumili ng node", "Maligayang pagbabalik", "Nakakonekta ang wallet", "Naglo-load...", "Aktibo", "Maghanap", "Ikonekta ang wallet", "Nakakonekta ang wallet", "Handa nang magsimula", "ng investment journey?", "Magsimulang libre", "© 2025 AlphaBag. Lahat ng karapatan ay nakalaan.") },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    lng: localStorage.getItem("alphabag-lang") || undefined,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "alphabag-lang",
    },
    interpolation: { escapeValue: false },
  });

export default i18n;

export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", flag: "🇹🇭", nativeName: "ภาษาไทย" },
  { code: "id", name: "Indonesian", flag: "🇮🇩", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", flag: "🇲🇾", nativeName: "Bahasa Melayu" },
  { code: "ru", name: "Russian", flag: "🇷🇺", nativeName: "Русский" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", nativeName: "Türkçe" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "pl", name: "Polish", flag: "🇵🇱", nativeName: "Polski" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", nativeName: "Nederlands" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦", nativeName: "Українська" },
  { code: "tl", name: "Filipino", flag: "🇵🇭", nativeName: "Filipino" },
];
