import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { TeamMember, ThematicRole } from '@/types/electoral.types';

type ThematicRoleExtended = ThematicRole & {
  acronym?: string | null;
  is_commission?: boolean;
  parent_role_id?: string | null;
};

type RoleMemberAssignment = {
  id: string;
  is_primary: boolean;
  electoral_list_member: {
    id: string;
    team_member: TeamMember;
  } | null;
};

type ThematicRoleWithMembers = ThematicRoleExtended & {
  electoral_member_roles?: RoleMemberAssignment[];
};

type RoleNode = {
  id: string;
  name: string;
  color: string | null;
  is_commission: boolean;
  members: TeamMember[];
  radius: number;
  x: number;
  y: number;
};

const MAX_VISIBLE_MEMBERS = 6;

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const buildMembers = (role: ThematicRoleWithMembers): TeamMember[] => {
  return (role.electoral_member_roles || [])
    .filter((assignment) => assignment.electoral_list_member?.team_member)
    .map((assignment) => assignment.electoral_list_member!.team_member);
};

const getRoleRadius = (membersCount: number) => {
  if (membersCount >= 8) return 80;
  if (membersCount >= 5) return 72;
  if (membersCount >= 3) return 64;
  return 58;
};

type ThematicRolesCircleViewProps = {
  roles: ThematicRoleWithMembers[];
  height?: number;
  onSelectRole?: (roleId: string) => void;
};

const ThematicRolesCircleView = ({ roles, height, onSelectRole }: ThematicRolesCircleViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(960);
  const [containerHeight, setContainerHeight] = useState(600);
  const [layoutNodes, setLayoutNodes] = useState<RoleNode[]>([]);
  const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(Math.max(640, Math.floor(entry.contentRect.width)));
      setContainerHeight(Math.max(480, Math.floor(entry.contentRect.height)));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const resolvedHeight = height ?? containerHeight;

  const nodes = useMemo(() => {
    return roles.map((role) => {
      const members = buildMembers(role);
      return {
        id: role.id,
        name: role.name,
        color: role.color,
        is_commission: !!role.is_commission,
        members,
        radius: getRoleRadius(members.length),
        x: 0,
        y: 0,
      };
    });
  }, [roles]);

  useEffect(() => {
    if (nodes.length === 0) {
      setLayoutNodes([]);
      return;
    }

    const commissionCenter = { x: width * 0.32, y: resolvedHeight * 0.5 };
    const othersCenter = { x: width * 0.75, y: resolvedHeight * 0.5 };
    const parentRadius = Math.min(width * 0.28, resolvedHeight * 0.4);

    const simulationNodes = nodes.map((node) => ({ ...node }));

    const simulation = d3
      .forceSimulation(simulationNodes)
      .force(
        'x',
        d3
          .forceX((node) => (node.is_commission ? commissionCenter.x : othersCenter.x))
          .strength(0.12)
      )
      .force(
        'y',
        d3
          .forceY((node) => (node.is_commission ? commissionCenter.y : othersCenter.y))
          .strength(0.12)
      )
      .force('charge', d3.forceManyBody().strength(-40))
      .force('collide', d3.forceCollide().radius((node) => node.radius + 8))
      .stop();

    for (let i = 0; i < 200; i += 1) {
      simulation.tick();
      simulationNodes.forEach((node) => {
        if (!node.is_commission) return;
        const dx = node.x - commissionCenter.x;
        const dy = node.y - commissionCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = parentRadius - node.radius - 8;
        if (distance > maxDistance && distance > 0) {
          node.x = commissionCenter.x + (dx / distance) * maxDistance;
          node.y = commissionCenter.y + (dy / distance) * maxDistance;
        }
      });
    }

    setLayoutNodes(simulationNodes);
  }, [nodes, width, resolvedHeight]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 3.5])
      .on('zoom', (event) => {
        setZoomTransform(event.transform);
      });
    zoomBehaviorRef.current = zoom;
    svg.call(zoom as any);
    const initial = d3.zoomIdentity.translate(width * 0.05, resolvedHeight * 0.05).scale(1);
    svg.call(zoom.transform as any, initial);
  }, [width, resolvedHeight, layoutNodes.length]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy as any, 1.2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy as any, 0.8);
  };

  const handleZoomReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const initial = d3.zoomIdentity.translate(width * 0.05, resolvedHeight * 0.05).scale(1);
    d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.transform as any, initial);
  };

  const handleFullscreenToggle = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  };

  const commissionNodes = layoutNodes.filter((node) => node.is_commission);
  const otherNodes = layoutNodes.filter((node) => !node.is_commission);
  const commissionCenter = { x: width * 0.32, y: resolvedHeight * 0.5 };
  const parentRadius = Math.min(width * 0.28, resolvedHeight * 0.4);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-auto bg-white"
      style={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 220px)',
        minHeight: 520,
      }}
    >
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label="Dézoomer">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label="Zoomer">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomReset} aria-label="Réinitialiser le zoom">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleFullscreenToggle} aria-label="Plein écran">
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      <TooltipProvider>
        <svg
          ref={svgRef}
          width="100%"
          height={resolvedHeight}
          viewBox={`0 0 ${width} ${resolvedHeight}`}
          className="cursor-grab active:cursor-grabbing"
        >
          <g transform={`translate(${zoomTransform.x}, ${zoomTransform.y}) scale(${zoomTransform.k})`}>
            <circle
              cx={commissionCenter.x}
              cy={commissionCenter.y}
              r={parentRadius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={2}
            />
            <text
              x={commissionCenter.x}
              y={commissionCenter.y - parentRadius + 24}
              textAnchor="middle"
              className="fill-slate-600 text-sm font-semibold"
            >
              Commissions
            </text>

            {commissionNodes.map((node) => (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => onSelectRole?.(node.id)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={node.color || '#F3F4F6'}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <text
                  x={node.x}
                  y={node.y - node.radius + 20}
                  textAnchor="middle"
                  className="fill-slate-900 text-xs font-semibold"
                >
                  {node.name}
                </text>
                <foreignObject
                  x={node.x - node.radius + 8}
                  y={node.y - 6}
                  width={node.radius * 2 - 16}
                  height={node.radius * 2 - 16}
                >
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {node.members.slice(0, MAX_VISIBLE_MEMBERS).map((member) => (
                      <Tooltip key={member.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.image || undefined} alt={member.name} />
                            <AvatarFallback className="text-[9px]">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{member.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {node.members.length > MAX_VISIBLE_MEMBERS && (
                      <div className="h-6 w-6 rounded-full bg-white/80 text-[9px] flex items-center justify-center text-slate-600">
                        +{node.members.length - MAX_VISIBLE_MEMBERS}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            ))}

            {otherNodes.map((node) => (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => onSelectRole?.(node.id)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={node.color || '#F3F4F6'}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <text
                  x={node.x}
                  y={node.y - node.radius + 20}
                  textAnchor="middle"
                  className="fill-slate-900 text-xs font-semibold"
                >
                  {node.name}
                </text>
                <foreignObject
                  x={node.x - node.radius + 8}
                  y={node.y - 6}
                  width={node.radius * 2 - 16}
                  height={node.radius * 2 - 16}
                >
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {node.members.slice(0, MAX_VISIBLE_MEMBERS).map((member) => (
                      <Tooltip key={member.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.image || undefined} alt={member.name} />
                            <AvatarFallback className="text-[9px]">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{member.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {node.members.length > MAX_VISIBLE_MEMBERS && (
                      <div className="h-6 w-6 rounded-full bg-white/80 text-[9px] flex items-center justify-center text-slate-600">
                        +{node.members.length - MAX_VISIBLE_MEMBERS}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            ))}

            {otherNodes.length > 0 && (
              <text
              x={width * 0.75}
              y={resolvedHeight * 0.12}
                textAnchor="middle"
                className="fill-slate-600 text-sm font-semibold"
              >
                Autres rôles
              </text>
            )}
          </g>
        </svg>
      </TooltipProvider>
    </div>
  );
};

export default ThematicRolesCircleView;
