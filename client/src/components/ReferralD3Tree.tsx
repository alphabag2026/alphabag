import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, RefreshCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TreeNode {
  id: number;
  name?: string | null;
  walletAddress?: string | null;
  referralCode?: string | null;
  totalInvested?: number;
  level?: number;
  children?: TreeNode[];
}

interface D3TreeNode extends d3.HierarchyNode<TreeNode> {
  x: number;
  y: number;
}

interface Props {
  rootNode: TreeNode;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: number) => void;
}

const NODE_COLORS = [
  "#f59e0b", // L1 - amber (root)
  "#3b82f6", // L2 - blue
  "#8b5cf6", // L3 - purple
  "#10b981", // L4 - emerald
  "#f43f5e", // L5+ - rose
];

function getNodeColor(depth: number) {
  return NODE_COLORS[Math.min(depth, NODE_COLORS.length - 1)];
}

function shortLabel(node: TreeNode) {
  if (node.walletAddress) {
    return `${node.walletAddress.slice(0, 6)}...${node.walletAddress.slice(-4)}`;
  }
  return node.name ?? `#${node.id}`;
}

export default function ReferralD3Tree({ rootNode, width = 900, height = 550, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: TreeNode } | null>(null);
  const [nodeCount, setNodeCount] = useState(0);

  const renderTree = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // 줌 설정
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    gRef.current = g.node();

    // 계층 데이터 생성
    const root = d3.hierarchy<TreeNode>(rootNode, d => d.children ?? []);
    const totalNodes = root.descendants().length;
    setNodeCount(totalNodes);

    // 트리 레이아웃 - 노드 수에 따라 동적 크기 조정
    const nodeSize = Math.max(60, Math.min(120, innerH / (root.height + 1)));
    const treeLayout = d3.tree<TreeNode>()
      .size([innerW, innerH])
      .nodeSize([nodeSize, nodeSize * 1.8]);

    treeLayout(root);

    // 링크 (곡선)
    const linkGen = d3.linkVertical<d3.HierarchyLink<TreeNode>, d3.HierarchyNode<TreeNode>>()
      .x(d => (d as D3TreeNode).x)
      .y(d => (d as D3TreeNode).y);

    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGen as any)
      .attr("fill", "none")
      .attr("stroke", "#374151")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6);

    // 노드 그룹
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${(d as D3TreeNode).x},${(d as D3TreeNode).y})`)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).select("circle")
          .transition().duration(150)
          .attr("r", d.depth === 0 ? 22 : 16);
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d.data,
        });
      })
      .on("mouseleave", function (_, d) {
        d3.select(this).select("circle")
          .transition().duration(150)
          .attr("r", d.depth === 0 ? 20 : 14);
        setTooltip(null);
      })
      .on("click", function (_, d) {
        if (onNodeClick && d.data.id) {
          onNodeClick(d.data.id);
        }
      });

    // 노드 원
    node.append("circle")
      .attr("r", d => d.depth === 0 ? 20 : 14)
      .attr("fill", d => getNodeColor(d.depth))
      .attr("fill-opacity", d => d.depth === 0 ? 1 : 0.85)
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2);

    // 레벨 뱃지 (L1, L2...)
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("font-size", d => d.depth === 0 ? "10px" : "8px")
      .attr("font-weight", "bold")
      .text(d => `L${d.depth + 1}`);

    // 이름 레이블
    node.append("text")
      .attr("y", d => d.depth === 0 ? 28 : 22)
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .attr("font-size", "10px")
      .attr("font-weight", d => d.depth === 0 ? "600" : "400")
      .text(d => {
        const label = shortLabel(d.data);
        return label.length > 12 ? label.slice(0, 12) + "…" : label;
      });

    // 투자금액 레이블 (있을 때만)
    node.filter(d => Number(d.data.totalInvested ?? 0) > 0)
      .append("text")
      .attr("y", d => d.depth === 0 ? 40 : 34)
      .attr("text-anchor", "middle")
      .attr("fill", "#34d399")
      .attr("font-size", "9px")
      .text(d => `$${Number(d.data.totalInvested ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

    // 자식 수 뱃지
    node.filter(d => (d.children?.length ?? 0) > 0)
      .append("g")
      .attr("transform", d => `translate(${d.depth === 0 ? 14 : 10},${d.depth === 0 ? -14 : -10})`)
      .call(g => {
        g.append("circle")
          .attr("r", 7)
          .attr("fill", "#1d4ed8")
          .attr("stroke", "#1f2937")
          .attr("stroke-width", 1.5);
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("fill", "white")
          .attr("font-size", "7px")
          .attr("font-weight", "bold")
          .text(d => d.children!.length);
      });

    // 초기 뷰 - 루트 노드 중앙 정렬
    const rootX = (root as D3TreeNode).x;
    const rootY = (root as D3TreeNode).y;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2 - rootX, height / 4 - rootY)
    );
  }, [rootNode, width, height]);

  useEffect(() => {
    renderTree();
  }, [renderTree]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300)
      .call(zoomRef.current.scaleBy, factor);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(400)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(width / 2, height / 4));
  };

  return (
    <div className="relative select-none">
      {/* 컨트롤 버튼 */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button size="icon" variant="outline" className="w-7 h-7 bg-background/80 backdrop-blur-sm" onClick={() => handleZoom(1.3)}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="w-7 h-7 bg-background/80 backdrop-blur-sm" onClick={() => handleZoom(0.77)}>
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="w-7 h-7 bg-background/80 backdrop-blur-sm" onClick={handleReset}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* 노드 수 표시 */}
      <div className="absolute top-2 left-2 z-10">
        <span className="text-xs bg-background/80 backdrop-blur-sm border border-border/40 rounded-md px-2 py-1 text-muted-foreground">
          총 {nodeCount}명
        </span>
      </div>

      {/* 범례 */}
      <div className="absolute bottom-2 left-2 z-10 flex gap-2 flex-wrap">
        {["L1 루트", "L2", "L3", "L4", "L5+"].map((label, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: NODE_COLORS[i] }} />
            {label}
          </span>
        ))}
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full rounded-xl bg-muted/10 border border-border/30"
        style={{ maxHeight: height }}
      />

      {/* 툴팁 */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-popover border border-border/60 rounded-xl shadow-xl p-3 text-xs min-w-[160px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-semibold text-foreground mb-1">
            {tooltip.node.walletAddress
              ? `${tooltip.node.walletAddress.slice(0, 10)}...${tooltip.node.walletAddress.slice(-6)}`
              : (tooltip.node.name ?? `User #${tooltip.node.id}`)}
          </p>
          {tooltip.node.referralCode && (
            <p className="text-primary font-mono">코드: {tooltip.node.referralCode}</p>
          )}
          {Number(tooltip.node.totalInvested ?? 0) > 0 && (
            <p className="text-emerald-400">투자: ${Number(tooltip.node.totalInvested).toLocaleString()}</p>
          )}
          {(tooltip.node.children?.length ?? 0) > 0 && (
            <p className="text-blue-400">직접 추천: {tooltip.node.children!.length}명</p>
          )}
        </div>
      )}
    </div>
  );
}
