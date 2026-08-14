import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type Lang = "ko" | "zh";

const ZH = {
  home: "首页",
  title: "AlphaBag 介绍",
  badge: "AlphaBag Community Platform",
  hero_h1_1: "加密货币生态系统的中心",
  hero_p1: "AlphaBag 不是单一协议或单一项目。它是连接交易所·媒体·项目·社区(投资者)·VC 的基于社区的市场激活平台。",
  hero_p2: "每个市场都存在一级和二级，各层级以不同的逻辑和规模运作。AlphaBag 处于能够连接所有这些层级的最中立且最有力的位置。",
  why_h2: "为什么创建 AlphaBag",
  why_p: "Web3 市场中项目崩溃的原因不止一个。无论技术实力或愿景如何，项目随时可能因各种外部和内部因素而崩溃。",
  risk_cards: [
    { title: "技术与安全风险", desc: "黑客攻击、合约漏洞、故意洗钱等，一次事故就可能摧毁一个项目。" },
    { title: "资金流动问题", desc: "资金流入过少，或相反地大量资金在短期内涌入导致结构崩溃的情况也很常见。" },
    { title: "恶意套现", desc: "快速套利、内部人员恶意抛售、以短期收益为目标的结构会迅速摧毁项目的信任。" }
  ],
  why_p2: "在这种情况下，领导者可能在没有认识到问题本质的情况下努力工作，看起来像是在创造收益。然而，当项目崩溃时，不仅会失去信任，在某些情况下还要承担法律风险。",
  why_p3: "AlphaBag 的创建就是为了不重复这些结构性问题。避免依赖单一项目，通过分散投资和保险投资的结构，尽可能防止本金损失，以运营资产为目标。",
  reality_cards: [
    { title: "项目有生命周期", desc: "没有任何项目是永恒的，成长与衰退是必然的过程。" },
    { title: "领导者已经在投资", desc: "即使平台不介绍，大多数领导者已经在选择和推进各种项目。" },
    { title: "不管理损失的结构", desc: "现有投资方式往往专注于收益，而将损失管理留给个人。" }
  ],
  core_h2: "AlphaBag 的核心方向",
  core_p: "AlphaBag 在收益之前先考虑生存。通过分散投资和保险结构来管理风险。",
  core_items: [
    "所有投资都以损失可能性为前提进行设计",
    "排除对单一项目的依赖",
    "收益 + 保险(Protection) 并行结构",
    "链上透明度",
    "DAO·社区主导决策"
  ],
  community_h2: "AlphaBag 社区运营原则与成长战略",
  community_p: "AlphaBag 社区以'换手投资(Portfolio Rotation)'和'超分散投资'为核心原则。基于100个以上项目信息进行分散参与，目标是长期维持一旦建立的组织并共同成长。",
  community_items1: [
    { title: "100+ 项目分散参与", desc: "不依赖特定1个项目，同时追踪和参与多个项目。" },
    { title: "换手投资(轮换)", desc: "根据市场环境变化，以降低风险、扩大机会的方向重新调整投资组合。" },
    { title: "组织的长期维持", desc: "设计为即使项目更换，社区运营体系也能维持。" }
  ],
  community_p2: "当用户足够多时，基于社区的集体执行力，推进各种收益和风险对冲策略。",
  community_items2: [
    { title: "共同铸造/共同参与", desc: "在低估项目或模因币领域通过共同铸造和共同参与追求收益。" },
    { title: "风险对冲", desc: "利用共同收益降低波动性风险，长期追求稳定运营。" },
    { title: "空投累积", desc: "持续参与空投，扩大参与者持有代币的机会。" }
  ],
  community_p3: "当社区规模扩大时，通过发行代币设计让所有参与者共享成长成果。在代币发行前，通过AlphaBag积分制度根据活动和贡献提供福利。",
  position_h2: "AlphaBag 的位置与角色",
  position_p: "加密货币行业是交易所·媒体·项目·社区·VC 以不同利益关系运作的复合生态系统。AlphaBag 以成为所有这些领域的中心枢纽为目标。",
  position_cards: [
    { title: "交易所 (Exchange)", desc: "Binance 等一级交易所由于竞争结构和体量差异，往往不与网络型组织或下级交易所建立表面合作关系。" },
    { title: "媒体 & VC", desc: "顶级媒体和顶级VC不会直接与未经验证的社区合作。需要可信赖的中介。" },
    { title: "社区 & 项目", desc: "项目需要流动性、交易量和参与者，但往往缺乏持续维持这些的结构。" }
  ],
  position_p2: "AlphaBag 重要的原因很明确。它处于能够与顶级交易所、顶级媒体、顶级投资机构合作的位置，同时拥有推动市场的组织、领导者和社区。",
  position_p3: "AlphaBag 的目标是在流动性退出时重新激活市场，为刚起步的项目创造初始交易和参与，为垂死的项目重新注入生命。",
  position_p4: "归根结底，所有行业的核心是组织和领导者。AlphaBag 致力于成为从一级到孵化阶段的所有项目都能合作的最佳交叉点。",
  eco_title: "AlphaBag Ecosystem Map",
  global_h2: "全球扩张",
  global_p: "AlphaBag 目前正与20个以上国家的社区领导者一起构建国家级分散型社区，打造以共同构建者(Co-builders)为中心的生态系统。",
  global_items: [
    { title: "2026年目标", desc: "培育各国1,000名以上核心领导者" },
    { title: "全球用户目标", desc: "10万名以上活跃用户基础的阶段性扩张" },
    { title: "中长期社区规模", desc: "确保全球200万名以上参与者" }
  ],
  global_p2: "与基金会及合作伙伴合作，筛选Binance Alpha候选项目(约10个)及长期优质项目。",
  global_items2: [
    { title: "长期成长资产", desc: "ETH、BNB、OKB、SOL等经过验证的主要资产" },
    { title: "长期运营型DeFi", desc: "发掘像Origin一样具有长期可持续结构的DeFi项目" },
    { title: "新Alpha机会", desc: "发掘处于初期阶段但结构优秀的项目" }
  ],
  global_p3: "大多数投资难以创造巨大成功，但如果一个或两个，甚至多个项目成功，资产可以呈指数级增长。",
  global_p4: "Origin项目被提及为在长期结构中创造巨大成果的案例。AlphaBag 以'长期生存 + 结构性保护 + 分散'的方向，致力于提高类似成果的可能性。",
  bag_h2: "AlphaBag BAG 系统",
  bag_p: "AlphaBag 不是单一投资模型，而是根据风险偏好和市场情况可选择的多层资产运营结构。",
  bag_cards: [
    { title: "ABAG (Airbag)", desc: "ABAG 是 AlphaBag 的核心安全装置。设计为最安全、最长期可持续的DeFi模型，目前正与金融专家更新模型，即将推出。", color: "text-blue-400" },
    { title: "BBAG (Plan B)", desc: "BBAG 是以团队·网络收益为中心的主要区间。基于固定质押的稳定增值 + 各项目团队/网络收益结构，提供日收益·月收益等多种收益模型。", color: "text-amber-400" },
    { title: "CBAG (Capital Protection)", desc: "CBAG 将总资产的约20%配置于BTC等保护资产/流动性资产，以降低风险，并在发生损失时以保险概念补偿机制为目标。", color: "text-emerald-400" },
    { title: "SBAG (Super Bag)", desc: "SBAG 是特殊项目区间，以能够实时回收本金和收益的灵活回收结构为目标。", color: "text-purple-400" }
  ],
  bag_p2: "BAG系统以风险管理·持续性·资产保护为优先设计，以市场情况为基础追求灵活的运营扩展。",
  goal_h2: "AlphaBag 的目标与领导者中心结构",
  goal_p1: "领导者一旦成为领导者就想持续担任领导者，跟随领导者的投资者希望通过好项目持续感受到感谢和信任并共同前行。",
  goal_p2: "然而，当项目崩溃或出现收益率更高的新项目时，从投资者角度来看，分散投资多个项目是现实的，许多中级领导者已经参与多个项目。",
  goal_cards: [
    { title: "集中型领导者的风险", desc: "专注于一个项目有很大的收益机会，但崩溃时需要承担的风险也很大。" },
    { title: "投资者的多样性", desc: "投资者性格各异，难以用一个项目满足所有人。" },
    { title: "可信赖的中介", desc: "投资者需要能够分散投资、快速获取信息、验证所有者和技术人员的可信赖中介。" }
  ],
  goal_p3: "AlphaBag 以媒体、VC、交易所、网红、法律·金融等各种专业节点参与，验证和过滤恶意/设计不良项目的结构为目标。",
  goal_p4: "此外，领导者不再需要像以前那样每次业务更换时重建下属组织，而是以一旦确定的组织腿为基础，各种业务水平移动并自动持续收益化的结构为目标。",
  goal_p5: "在这整个过程中，核心是'组织的持续性'和'基于信任的长期运营'。",
  invest_h2: "投资的现实与 AlphaBag 的哲学",
  invest_p1: "投资无法保证100%收益。许多Web3项目存在利用投资者获取内部收益而非为投资者利益服务的结构。",
  invest_p2: "金融市场与股票市场一样是自由交易市场，高点进入被套的情况也很常见。",
  invest_p3: "市场有很多通过低点进入和高点实现、各种交易选项创造收益的结构。",
  invest_p4: "AlphaBag 社区以尽可能快速在低点进入，资产成长后再次寻找低价区间重新进入的稳定资产增值为目标。",
  invest_p5: "同时，将部分资产小规模配置于模因币等高风险·高收益领域，以偶尔出现的大收益机会辅助整体成长。",
  invest_p6: "AlphaBag 的目的是将艰难构建的领导者-投资者信任关系在一个平台上连接为持续收益结构，成长为能够跨越世代延续的稳定去中心化社区。",
  last_h2: "最后的寄语",
  last_p1: "对于犹豫是否参与AlphaBag的朋友们和各位领导者，市场最终将加入AlphaBag这样的社区投资平台。",
  last_p2: "重要的不是是否参与，而是加入的速度有多快。越快就能在确保下属推荐人、增加资产的队伍中占据领先位置。",
  last_p3: "AlphaBag 不是短期流行，而是以领导者和社区长期共同成长的结构为目标。",
  cta: "探索 AlphaBag 平台",
  copyright: "© AlphaBag 社区平台. All rights reserved."
};

export default function Introduction() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [lang, setLang] = useState<Lang>("ko");

  const bg = isDark ? "bg-[#0a0a0a]" : "bg-muted/60";
  const textPrimary = isDark ? "text-white" : "text-foreground";
  const textSecondary = isDark ? "text-gray-400" : "text-muted-foreground";
  const cardBg = isDark ? "bg-[#111] border-white/8" : "bg-card border-border";
  const sectionBg = isDark ? "bg-[#0f0f0f] border-white/5" : "bg-card border-border/60";
  const accentColor = "text-amber-400";
  const accentBg = isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200";

  const isZh = lang === "zh";
  const t = ZH;

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* 헤더 네비 */}
      <div className={`sticky top-0 z-10 border-b ${isDark ? "bg-[#0a0a0a]/95 border-white/5" : "bg-card/95 border-border"} backdrop-blur-xl`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <button className={`flex items-center gap-1.5 text-xs ${textSecondary} hover:${textPrimary} transition-colors`}>
              <ArrowLeft className="w-4 h-4" />
              {isZh ? t.home : "홈으로"}
            </button>
          </Link>
          <ChevronRight className={`w-3 h-3 ${textSecondary}`} />
          <span className={`text-xs font-semibold ${textPrimary}`}>{isZh ? t.title : "AlphaBag 소개"}</span>
          {/* 언어 전환 버튼 */}
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => setLang("ko")}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                lang === "ko"
                  ? "bg-amber-500 border-amber-500 text-black"
                  : isDark
                  ? "border-white/20 text-gray-400 hover:border-amber-500/50 hover:text-amber-400"
                  : "border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              🇰🇷 KO
            </button>
            <button
              onClick={() => setLang("zh")}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                lang === "zh"
                  ? "bg-amber-500 border-amber-500 text-black"
                  : isDark
                  ? "border-white/20 text-gray-400 hover:border-amber-500/50 hover:text-amber-400"
                  : "border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              🇨🇳 中文
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* ─── 히어로 섹션 ─── */}
        <section className="text-center mb-20">
          <div className="mb-6">
            <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${accentBg} ${accentColor} mb-4`}>
              {isZh ? t.badge : "AlphaBag Community Platform"}
            </span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-black ${textPrimary} leading-tight mb-6`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.hero_h1_1 : "암호화폐 생태계의 중심"}<br />
            <span className={accentColor}>AlphaBag Community Platform</span>
          </h1>
          <p className={`text-base md:text-lg ${textSecondary} max-w-2xl mx-auto leading-relaxed mb-4`}>
            {isZh ? t.hero_p1 : "AlphaBag은 하나의 프로토콜이나 단일 프로젝트가 아닙니다. 거래소 · 미디어 · 프로젝트 · 커뮤니티(투자자) · VC를 연결하는 커뮤니티 기반 시장 활성화 플랫폼입니다."}
          </p>
          <p className={`text-sm ${textSecondary} max-w-2xl mx-auto leading-relaxed`}>
            {isZh ? t.hero_p2 : "모든 시장에는 1티어와 2티어가 존재하고, 각 티어는 서로 다른 논리와 체급으로 움직입니다. AlphaBag은 이 모든 층위를 연결할 수 있는 가장 중립적이면서도 강력한 위치에 서 있습니다."}
          </p>
        </section>

        {/* ─── 왜 만들어졌는가 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${sectionBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${accentColor} mb-4`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.why_h2 : "왜 AlphaBag이 만들어졌는가"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-8`}>
            {isZh ? t.why_p : "Web3 시장에서 프로젝트가 무너지는 이유는 단 하나가 아닙니다. 기술력이나 비전과 무관하게 다양한 외부·내부 요인으로 프로젝트는 언제든 붕괴될 수 있습니다."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {(isZh ? t.risk_cards : [
              { title: "기술·보안 리스크", desc: "해킹, 컨트랙트 취약점, 의도적 자금 세탁 등은 단 한 번의 사고로 프로젝트를 무너뜨릴 수 있습니다." },
              { title: "자금 흐름 문제", desc: "자금 유입이 지나치게 적거나, 반대로 대규모 자금이 단기간에 유입되며 구조가 붕괴되는 경우도 빈번합니다." },
              { title: "악의적 수익 실현", desc: "빠른 차익 실현, 내부자의 악의적인 매도, 단기 수익을 노린 구조는 프로젝트의 신뢰를 급격히 붕괴시킵니다." }
            ]).map((item, i) => (
              <div key={i} className={`rounded-xl border p-5 ${cardBg}`}>
                <h3 className={`text-sm font-bold ${accentColor} mb-2`}>{item.title}</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.why_p2 : <>이러한 상황에서 리더들은 문제의 본질을 인지하지 못한 채 열심히 활동하며 수익을 만들어내는 것처럼 보일 수 있습니다. 그러나 프로젝트가 무너지는 순간 <strong className={textPrimary}>신뢰 상실</strong>은 물론이고, 경우에 따라서는 <strong className={textPrimary}>법적 리스크</strong>까지 떠안게 됩니다.</>}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed`}>
            {isZh ? t.why_p3 : <>AlphaBag은 이러한 구조적 문제를 반복하지 않기 위해 만들어졌습니다. 단일 프로젝트 의존을 피하고, <strong className={textPrimary}>분산 투자와 보험 투자</strong>라는 구조를 통해 가능한 한 <strong className={textPrimary}>원금 손실을 방지</strong>하며 자산을 운영하는 것을 목표로 합니다.</>}
          </p>
        </section>

        {/* ─── 3가지 현실 카드 ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(isZh ? t.reality_cards : [
            { title: "프로젝트는 생명주기를 가진다", desc: "어떤 프로젝트도 영원하지 않으며, 성장과 쇠퇴는 필연적인 과정입니다." },
            { title: "리더들은 이미 투자하고 있다", desc: "플랫폼이 소개하지 않아도 대부분의 리더는 이미 다양한 프로젝트를 선택하고 진행합니다." },
            { title: "손실을 관리하지 않는 구조", desc: "기존 투자 방식은 수익에 집중하고 손실 관리는 개인에게 맡겨지는 경우가 많습니다." }
          ]).map((item, i) => (
            <div key={i} className={`rounded-xl border p-5 ${cardBg}`}>
              <h3 className={`text-sm font-bold ${accentColor} mb-2`}>{item.title}</h3>
              <p className={`text-xs ${textSecondary} leading-relaxed`}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ─── 핵심 방향 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${accentBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${accentColor} mb-3`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.core_h2 : "AlphaBag의 핵심 방향"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
            {isZh ? t.core_p : "AlphaBag은 수익보다 먼저 생존을 고민합니다. 분산 투자와 보험 구조를 통해 리스크를 관리합니다."}
          </p>
          <ul className="space-y-2">
            {(isZh ? t.core_items : [
              "모든 투자는 손실 가능성을 전제로 설계",
              "단일 프로젝트 의존 배제",
              "수익 + 보험(Protection) 병행 구조",
              "온체인 투명성",
              "DAO·커뮤니티 주도 의사결정"
            ]).map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0`} />
                <span className={`text-sm ${textPrimary} font-medium`}>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── 커뮤니티 운영 원칙 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${sectionBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${textPrimary} mb-3`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.community_h2 : "AlphaBag 커뮤니티 운영 원칙과 성장 전략"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
            {isZh ? t.community_p : "AlphaBag 커뮤니티는 '손바뀜 투자(Portfolio Rotation)'와 '초분산 투자'라는 원칙을 중심에 둡니다. 100개 이상의 프로젝트 정보를 기반으로 분산 참여하며, 한 번 만들어진 조직을 오랜 기간 유지하고 함께 성장하는 것을 목표로 합니다."}
          </p>
          <div className="space-y-3 mb-6">
            {(isZh ? t.community_items1 : [
              { title: "100+ 프로젝트 분산 참여", desc: "특정 1개 프로젝트에 의존하지 않고 다수의 프로젝트를 동시에 추적·참여합니다." },
              { title: "손바뀜 투자(로테이션)", desc: "시장 환경 변화에 따라 위험을 줄이고 기회를 넓히는 방향으로 포트폴리오를 재조정합니다." },
              { title: "조직의 장기 유지", desc: "프로젝트가 바뀌어도 커뮤니티 운영 체계는 유지되도록 설계합니다." }
            ]).map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5`} />
                <div>
                  <span className={`text-sm font-bold ${textPrimary}`}>{item.title}</span>
                  <span className={`text-sm ${textSecondary}`}>: {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-4`}>
            {isZh ? t.community_p2 : "유저가 충분히 모이면, 커뮤니티의 집단 실행력을 바탕으로 다양한 방식의 수익 및 리스크 헤지 전략을 추진합니다."}
          </p>
          <div className="space-y-3 mb-6">
            {(isZh ? t.community_items2 : [
              { title: "공동 민트/공동 참여", desc: "저평가 프로젝트 또는 밈 코인 영역에서 공동 민트 및 공동 참여로 수익을 추구합니다." },
              { title: "리스크 헤지", desc: "공동 수익을 활용해 변동성 리스크를 완화하고 장기적으로 안정적 운영을 지향합니다." },
              { title: "에어드랍 기반 누적", desc: "지속적인 에어드랍 참여로 참여자의 토큰 보유 기회를 확장합니다." }
            ]).map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5`} />
                <div>
                  <span className={`text-sm font-bold ${textPrimary}`}>{item.title}</span>
                  <span className={`text-sm ${textSecondary}`}>: {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed`}>
            {isZh ? t.community_p3 : <>커뮤니티 규모가 커지면 토큰 발행을 통해 참여자 모두가 성장의 과실을 공유하도록 설계합니다. 토큰 발행 전에는 <strong className={textPrimary}>AlphaBag 포인트 제도</strong>로 활동과 기여에 따른 혜택을 제공합니다.</>}
          </p>
        </section>

        {/* ─── 위치와 역할 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${sectionBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${textPrimary} mb-3`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.position_h2 : "AlphaBag의 위치와 역할"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
            {isZh ? t.position_p : <>암호화폐 산업은 <strong className={textPrimary}>거래소 · 미디어 · 프로젝트 · 커뮤니티 · VC</strong>가 서로 다른 이해관계로 움직이는 복합 생태계입니다. AlphaBag은 이 모든 영역의 <strong className={textPrimary}>중심 허브</strong>를 목표로 합니다.</>}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(isZh ? t.position_cards : [
              { title: "거래소 (Exchange)", desc: "Binance 같은 1티어 거래소는 경쟁 구조와 체급 차이로 인해 네트워크형 조직이나 하위 거래소와 표면적 파트너십을 맺지 않는 경우가 많습니다." },
              { title: "미디어 & VC", desc: "탑 미디어와 탑 VC는 검증되지 않은 커뮤니티와 직접 협력하지 않습니다. 신뢰 가능한 매개체가 필요합니다." },
              { title: "커뮤니티 & 프로젝트", desc: "프로젝트는 유동성·거래량·참여자가 필요하지만, 이를 지속적으로 유지할 구조가 부족한 경우가 많습니다." }
            ]).map((item, i) => (
              <div key={i} className={`rounded-xl border p-5 ${cardBg}`}>
                <h3 className={`text-sm font-bold ${accentColor} mb-2`}>{item.title}</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.position_p2 : <>AlphaBag이 중요한 이유는 명확합니다. <strong className={textPrimary}>탑 거래소·탑 미디어·탑 투자사와 협력 가능한 위치</strong>에 있으면서, 동시에 시장을 움직이는 <strong className={textPrimary}>조직과 리더, 커뮤니티</strong>를 보유하기 때문입니다.</>}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.position_p3 : "AlphaBag의 목표는 유동성이 빠질 때 시장을 다시 활성화하고, 막 시작하는 프로젝트에는 초기 거래·참여를 만들며, 죽어가는 프로젝트에는 다시 생명을 불어넣는 것입니다."}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
            {isZh ? t.position_p4 : <>결국 모든 산업의 핵심은 <strong className={textPrimary}>조직과 리더</strong>입니다. AlphaBag은 1티어부터 인큐베이팅 단계의 프로젝트까지 모두가 협력할 수 있는 최적의 교차 지점을 지향합니다.</>}
          </p>

          {/* 에코시스템 맵 */}
          <div className={`rounded-xl border p-6 font-mono text-xs ${isDark ? "bg-black/30 border-white/5 text-green-400" : "bg-muted/50 border-border text-green-700"}`}>
            <div className={`text-sm font-bold ${accentColor} mb-3`}>{isZh ? t.eco_title : "AlphaBag Ecosystem Map"}</div>
            <div className="text-center leading-loose">
              <div>[ Top Exchanges ]</div>
              <div>Binance / Coinbase / Upbit</div>
              <div>│</div>
              <div>[ Top Media & VC ] ── <span className={accentColor}>AlphaBag</span> ── [ Community & Leaders ]</div>
              <div>│</div>
              <div>[ Projects & Incubation ]</div>
            </div>
          </div>
        </section>

        {/* ─── 글로벌 확장 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${sectionBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${textPrimary} mb-3`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.global_h2 : "글로벌 확장"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
            {isZh ? t.global_p : <>AlphaBag은 현재 <strong className={textPrimary}>20개국 이상의 커뮤니티 리더</strong>들과 함께 국가 단위의 분산형 커뮤니티를 구축하며, <strong className={textPrimary}>공동 구성원(Co-builders)</strong> 중심의 생태계를 만들어가고 있습니다.</>}
          </p>
          <div className="space-y-3 mb-6">
            {(isZh ? t.global_items : [
              { title: "2026년 목표", desc: "국가별 1,000명 이상의 핵심 리더 육성" },
              { title: "글로벌 유저 목표", desc: "10만 명 이상의 활성 유저 기반 단계적 확장" },
              { title: "중장기 커뮤니티 규모", desc: "총 200만 명 이상의 글로벌 참여자 확보" }
            ]).map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5`} />
                <div>
                  <span className={`text-sm font-bold ${textPrimary}`}>{item.title}</span>
                  <span className={`text-sm ${textSecondary}`}>: {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-4`}>
            {isZh ? t.global_p2 : <>재단 및 파트너와 협력하여 <strong className={textPrimary}>Binance Alpha 대기 프로젝트(약 10개)</strong> 및 장기 우수 프로젝트를 선별하고 있습니다.</>}
          </p>
          <div className="space-y-2">
            {(isZh ? t.global_items2 : [
              { title: "장기 성장 자산", desc: "ETH, BNB, OKB, SOL 등 검증된 메이저 자산" },
              { title: "장기 운용형 DeFi", desc: "Origin처럼 오랜 기간 지속 가능한 구조의 DeFi 프로젝트 발굴" },
              { title: "신규 Alpha 기회", desc: "초기 단계지만 구조적으로 우수한 프로젝트 발굴" }
            ]).map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5`} />
                <div>
                  <span className={`text-sm font-bold ${textPrimary}`}>{item.title}</span>
                  <span className={`text-sm ${textSecondary}`}>: {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed mt-4`}>
            {isZh ? t.global_p3 : <>대부분의 투자가 큰 성공을 만들기는 어렵지만, <strong className={textPrimary}>하나 또는 두 개, 더 나아가 여러 프로젝트가 성공한다면</strong> 자산은 기하급수적으로 성장할 수 있습니다.</>}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mt-3`}>
            {isZh ? t.global_p4 : "사례로 Origin 프로젝트는 장기 구조에서 큰 성과를 만든 케이스로 언급됩니다. AlphaBag은 '장기 생존 + 구조적 보호 + 분산'이라는 방향으로 비슷한 성과 가능성을 높이는 것을 지향합니다."}
          </p>
        </section>

        {/* ─── BAG 시스템 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${sectionBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${textPrimary} mb-3`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.bag_h2 : "AlphaBag BAG 시스템"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
            {isZh ? t.bag_p : <>AlphaBag은 단일 투자 모델이 아닌, 리스크 성향과 시장 상황에 따라 선택 가능한 <strong className={textPrimary}>다층적 자산 운용 구조</strong>로 설계되어 있습니다.</>}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {(isZh ? t.bag_cards : [
              { title: "ABAG (Airbag)", desc: "ABAG는 AlphaBag의 핵심 안전 장치입니다. 가장 안전하고 장기 지속 가능한 DeFi 모델로 설계되었으며, 현재 금융 전문가들과 모델을 업데이트 중이며 곧 출시 예정입니다.", color: "text-blue-400" },
              { title: "BBAG (Plan B)", desc: "BBAG는 팀·네트워크 수익 중심 메인 구간입니다. 고정 스테이킹 기반 안정적 증식 + 프로젝트별 팀/네트워크 수익 구조로 데일리·월 수익 등 다양한 수익 모델을 제공합니다.", color: "text-amber-400" },
              { title: "CBAG (Capital Protection)", desc: "CBAG는 전체 자산 중 약 20%를 BTC 등 보호 자산/유동성 자산에 배치하여 리스크를 완화하고, 손실 발생 시 보험 개념 보상 메커니즘을 지향합니다.", color: "text-emerald-400" },
              { title: "SBAG (Super Bag)", desc: "SBAG는 스페셜 프로젝트 구간이며, 실시간으로 원금과 수익을 회수할 수 있는 유연한 회수 구조를 지향합니다.", color: "text-purple-400" }
            ]).map((item, i) => (
              <div key={i} className={`rounded-xl border p-5 ${cardBg}`}>
                <h3 className={`text-sm font-bold ${item.color} mb-2`}>{item.title}</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed`}>
            {isZh ? t.bag_p2 : <>BAG 시스템은 단기 수익보다 <strong className={textPrimary}>리스크 관리 · 지속성 · 자산 보호</strong>를 우선으로 설계되며, 시장 상황에 따라 유연한 운용 확장을 지향합니다.</>}
          </p>
        </section>

        {/* ─── 목표와 리더 중심 구조 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${sectionBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${textPrimary} mb-3`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.goal_h2 : "AlphaBag의 목표와 리더 중심 구조"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.goal_p1 : "리더는 한 번 리더가 되면 계속 리더로 활동하고 싶고, 리더를 따라온 투자자는 좋은 프로젝트를 통해 지속적으로 감사와 신뢰를 느끼며 함께하고 싶습니다."}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
            {isZh ? t.goal_p2 : <>그러나 프로젝트 붕괴 또는 더 나은 수익률의 신규 프로젝트 등장 시, 투자자 입장에서는 <strong className={textPrimary}>다양한 프로젝트 분산 투자</strong>가 현실적이며 많은 중간급 리더는 이미 여러 프로젝트에 참여합니다.</>}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(isZh ? t.goal_cards : [
              { title: "집중형 리더의 리스크", desc: "하나의 프로젝트 집중은 큰 수익 기회가 있는 만큼, 붕괴 시 감당해야 할 리스크 또한 큽니다." },
              { title: "투자자의 다양성", desc: "투자자는 성향이 다르며 하나의 프로젝트로 모두를 만족시키기 어렵습니다." },
              { title: "신뢰 가능한 매개체", desc: "투자자는 분산 투자와 빠른 정보, 오너·기술진 검증이 가능한 신뢰 매개체를 원합니다." }
            ]).map((item, i) => (
              <div key={i} className={`rounded-xl border p-5 ${cardBg}`}>
                <h3 className={`text-sm font-bold ${accentColor} mb-2`}>{item.title}</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.goal_p3 : "AlphaBag은 미디어, VC, 거래소, 인플루언서, 법조·금융 등 다양한 전문가 노드가 참여하여 악의적/오설계 프로젝트를 검증·필터링하는 구조를 지향합니다."}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.goal_p4 : "또한 리더는 기존처럼 사업이 바뀔 때마다 산하 조직을 재건할 필요 없이, 한 번 정해진 조직 레그를 기반으로 다양한 사업이 수평 이동하며 자동 수익화가 이어지는 구조를 목표로 합니다."}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed`}>
            {isZh ? t.goal_p5 : <>이 모든 과정에서 핵심은 <strong className={textPrimary}>'조직의 지속성'</strong>과 <strong className={textPrimary}>'신뢰 기반의 장기 운용'</strong>입니다.</>}
          </p>
        </section>

        {/* ─── 투자의 현실과 철학 ─── */}
        <section className={`rounded-2xl border p-8 mb-8 ${sectionBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${textPrimary} mb-3`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.invest_h2 : "투자의 현실과 AlphaBag의 철학"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.invest_p1 : <>투자는 <strong className={textPrimary}>100% 수익을 보장할 수 없습니다</strong>. 많은 Web3 프로젝트는 투자자 이익보다 투자자를 활용해 내부 수익을 얻는 구조가 존재합니다.</>}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>{isZh ? t.invest_p2 : "금융시장은 주식과 마찬가지로 자율 거래 시장이며, 고점 진입으로 물리는 경우도 흔합니다."}</p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>{isZh ? t.invest_p3 : "시장은 저점 진입과 고점 실현, 다양한 거래 옵션으로 수익이 만들어지는 구조가 많습니다."}</p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.invest_p4 : <>AlphaBag 커뮤니티는 가능한 한 빠르게 저점에 진입하고, 자산이 성장하면 다시 저가 구간을 찾아 재진입하는 <strong className={textPrimary}>안정적 자산 증식</strong>을 목표로 합니다.</>}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.invest_p5 : "동시에 일부 자산은 소규모로 밈 코인 등 고위험·고수익 영역에 배치하여, 가끔 발생하는 큰 수익 기회로 전체 성장을 보조합니다."}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed`}>
            {isZh ? t.invest_p6 : <>AlphaBag의 목적은 어렵게 구축한 리더-투자자 신뢰 관계를 한 플랫폼에서 지속 수익 구조로 연결하고, 세대를 넘어 이어질 수 있는 <strong className={textPrimary}>안정적인 탈중심화 커뮤니티</strong>로 성장하는 것입니다.</>}
          </p>
        </section>

        {/* ─── 마지막 메시지 ─── */}
        <section className={`rounded-2xl border p-8 mb-12 ${accentBg}`}>
          <h2 className={`text-2xl md:text-3xl font-black ${accentColor} mb-4`}
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
            {isZh ? t.last_h2 : "마지막으로 드리는 메시지"}
          </h2>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.last_p1 : "AlphaBag 참여를 망설이는 분들과 리더 여러분, 시장은 결국 AlphaBag과 같은 커뮤니티 투자 플랫폼에 합류하게 될 것입니다."}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed mb-3`}>
            {isZh ? t.last_p2 : <>중요한 것은 참여 여부가 아니라 <strong className={textPrimary}>얼마나 빠르게 합류</strong>하느냐입니다. 빠를수록 산하 추천인을 확보하고 자산을 늘려가는 대열에 앞서 설 수 있습니다.</>}
          </p>
          <p className={`text-sm ${textSecondary} leading-relaxed`}>
            {isZh ? t.last_p3 : "AlphaBag은 단기 유행이 아니라, 장기적으로 리더와 커뮤니티가 함께 성장하는 구조를 지향합니다."}
          </p>
        </section>

        {/* ─── 하단 CTA ─── */}
        <div className="text-center">
          <Link href="/">
            <button className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors">
              {isZh ? t.cta : "AlphaBag 플랫폼 탐색하기"}
            </button>
          </Link>
          <p className={`text-xs ${textSecondary} mt-3`}>{isZh ? t.copyright : "© AlphaBag 커뮤니티 플랫폼. All rights reserved."}</p>
        </div>

      </div>
    </div>
  );
}
