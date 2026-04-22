import { useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Network, TrendingUp, Users, DollarSign, Search, ChevronDown, ChevronRight, Copy, CheckCheck, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── 지갑 주소 단축 표시 ──────────────────────────────────────────────────────
function WalletShort({ address }: { address?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!address) return <span className="text-muted-foreground">—</span>;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <button
      className="flex items-center gap-1 font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
    >
      {short}
      {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 opacity-50" />}
    </button>
  );
}

// ── 레퍼럴 트리 노드 ─────────────────────────────────────────────────────────
interface ReferralNode {
  id: number;
  name?: string | null;
  walletAddress?: string | null;
  referralCode?: string | null;
  totalInvested?: number;
  children?: ReferralNode[];
}

function TreeNode({ node, depth = 0 }: { node: ReferralNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer ${
          depth === 0 ? 'bg-primary/5 border border-primary/20 mb-1' : ''
        }`}
        style={{ marginLeft: `${depth * 18}px` }}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren ? (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          )}
        </span>

        <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
          depth === 0 ? 'bg-primary/20 text-primary' :
          depth === 1 ? 'bg-blue-500/20 text-blue-400' :
          depth === 2 ? 'bg-purple-500/20 text-purple-400' :
          'bg-muted text-muted-foreground'
        }`}>L{depth + 1}</span>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {node.walletAddress ? (
            <WalletShort address={node.walletAddress} />
          ) : (
            <span className="text-sm font-medium truncate">{node.name ?? `#${node.id}`}</span>
          )}
          {node.referralCode && (
            <span className="text-xs font-mono text-primary/70 hidden sm:inline">{node.referralCode}</span>
          )}
        </div>

        {Number(node.totalInvested ?? 0) > 0 && (
          <span className="text-xs text-green-400 flex-shrink-0">
            ${Number(node.totalInvested).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        )}

        {hasChildren && (
          <Badge className="badge-inactive text-xs flex-shrink-0">
            {node.children!.length}명
          </Badge>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-border/30 ml-5">
          {node.children!.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 레퍼럴 트리 뷰 ──────────────────────────────────────────────────────────
function ReferralTreeView() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: topReferrers } = trpc.referrals.topReferrers.useQuery({ limit: 50 });
  const { data: treeData, isLoading: treeLoading } = trpc.referrals.tree.useQuery(
    { userId: selectedUserId! },
    { enabled: selectedUserId !== null }
  );

  const filtered = useMemo(() => {
    if (!topReferrers) return [];
    if (!searchQuery) return topReferrers;
    const q = searchQuery.toLowerCase();
    return topReferrers.filter((r: any) =>
      (r.userName ?? '').toLowerCase().includes(q) ||
      (r.referralCode ?? '').toLowerCase().includes(q) ||
      (r.userWallet ?? '').toLowerCase().includes(q)
    );
  }, [topReferrers, searchQuery]);

  const handleSearch = useCallback((v: string) => {
    setSearchInput(v);
    clearTimeout((window as any)._refSearchTimer);
    (window as any)._refSearchTimer = setTimeout(() => setSearchQuery(v), 300);
  }, []);

  const treeNodes = useMemo((): ReferralNode[] => {
    if (!treeData || !Array.isArray(treeData)) return [];
    return treeData.map((r: any) => ({
      id: r.referredId ?? r.id,
      name: r.referredName ?? r.name,
      walletAddress: r.referredWallet ?? r.walletAddress,
      referralCode: r.referralCode,
      totalInvested: r.totalInvested ?? 0,
      children: [],
    }));
  }, [treeData]);

  const selectedUser = topReferrers?.find((r: any) =>
    (r.referrerId ?? r.userId) === selectedUserId
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 좌측: 추천인 목록 */}
      <div className="lg:col-span-1">
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">추천인 목록 (Top 50)</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={e => handleSearch(e.target.value)}
                placeholder="이름, 코드, 지갑 검색..."
                className="pl-8 h-8 text-xs bg-input"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0 max-h-[500px] overflow-y-auto space-y-0.5">
            {filtered?.map((ref: any, i: number) => {
              const uid = ref.referrerId ?? ref.userId;
              const isSelected = uid === selectedUserId;
              return (
                <button
                  key={uid}
                  onClick={() => setSelectedUserId(uid)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                    isSelected ? 'bg-primary/15 border border-primary/30' : 'hover:bg-accent/40'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                    i === 2 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {ref.userWallet ? (
                      <p className="text-xs font-mono text-blue-400 truncate">
                        {ref.userWallet.slice(0, 8)}...{ref.userWallet.slice(-4)}
                      </p>
                    ) : (
                      <p className="text-xs font-medium truncate">{ref.userName ?? `#${uid}`}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">{ref.referralCode ?? '—'}</p>
                  </div>
                  <Badge className="badge-inactive text-xs flex-shrink-0">
                    {ref.referralCount ?? ref.totalReferrals ?? 0}명
                  </Badge>
                </button>
              );
            })}
            {(!filtered || filtered.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">데이터 없음</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 우측: 트리 뷰 */}
      <div className="lg:col-span-2">
        <Card className="border-border/40 min-h-[400px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              {selectedUser ? (
                <span>
                  {selectedUser.userWallet
                    ? `${selectedUser.userWallet.slice(0, 8)}...`
                    : (selectedUser.userName ?? `User #${selectedUserId}`)
                  }의 레퍼럴 트리
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    ({selectedUser.referralCount ?? selectedUser.totalReferrals ?? 0}명 직접 추천)
                  </span>
                </span>
              ) : (
                '추천인을 선택하면 트리가 표시됩니다'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!selectedUserId && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <GitBranch className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">좌측에서 추천인을 선택하세요</p>
                <p className="text-xs mt-1">레퍼럴 네트워크 트리를 시각화합니다</p>
              </div>
            )}
            {selectedUserId && treeLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {selectedUserId && !treeLoading && (
              <div className="space-y-0.5 max-h-[450px] overflow-y-auto">
                <TreeNode
                  node={{
                    id: selectedUserId,
                    name: selectedUser?.userName,
                    walletAddress: selectedUser?.userWallet,
                    referralCode: selectedUser?.referralCode,
                    totalInvested: Number(selectedUser?.totalEarnings ?? 0),
                    children: treeNodes,
                  }}
                  depth={0}
                />
                {treeNodes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    직접 추천한 사용자가 없습니다
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function Referrals() {
  const { data: topReferrers } = trpc.referrals.topReferrers.useQuery({ limit: 20 });
  const { data: stats } = trpc.referrals.stats.useQuery();

  return (
    <AdminLayout title="Referral System">
      <div className="space-y-5">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "총 추천인", value: stats?.totalReferrers ?? 0, icon: Users, color: "text-blue-400" },
            { label: "총 레퍼럴", value: stats?.totalReferrals ?? 0, icon: Network, color: "text-emerald-400" },
            { label: "레퍼럴 수익", value: `$${Number(stats?.totalReferralRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-primary" },
            { label: "평균 추천수", value: stats?.avgReferralsPerUser?.toFixed(1) ?? "0", icon: TrendingUp, color: "text-purple-400" },
          ].map((s, i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 탭: 테이블 / 트리 뷰 */}
        <Tabs defaultValue="table">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="table" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Top 추천인 테이블
            </TabsTrigger>
            <TabsTrigger value="tree" className="gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              레퍼럴 트리 시각화
            </TabsTrigger>
          </TabsList>

          {/* 테이블 탭 */}
          <TabsContent value="table" className="mt-4">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  Top 추천인 (상위 20명)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 overflow-x-auto">
                <table className="w-full admin-table">
                  <thead>
                    <tr>
                      <th className="text-left">순위</th>
                      <th className="text-left">사용자</th>
                      <th className="text-left">레퍼럴 코드</th>
                      <th className="text-right">추천 수</th>
                      <th className="text-right">수익</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReferrers?.map((ref: any, i: number) => (
                      <tr key={ref.referrerId ?? ref.userId}>
                        <td>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                            i === 1 ? "bg-slate-400/20 text-slate-300" :
                            i === 2 ? "bg-amber-700/20 text-amber-600" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </div>
                        </td>
                        <td>
                          <div>
                            {ref.userWallet ? (
                              <WalletShort address={ref.userWallet} />
                            ) : (
                              <p className="font-medium text-sm">{ref.userName ?? `User #${ref.referrerId}`}</p>
                            )}
                            {ref.userEmail && <p className="text-xs text-muted-foreground">{ref.userEmail}</p>}
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-primary">
                            {ref.referralCode ?? "—"}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold">{ref.referralCount ?? ref.totalReferrals ?? 0}</span>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold text-primary">
                            ${Number(ref.totalEarnings ?? ref.totalEarned ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!topReferrers || topReferrers.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                          레퍼럴 데이터가 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 트리 시각화 탭 */}
          <TabsContent value="tree" className="mt-4">
            <ReferralTreeView />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
