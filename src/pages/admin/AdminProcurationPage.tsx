import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail,
  UserCheck,
  Search,
  Loader2,
  CheckCircle2,
  Unlink,
  UserX,
  UserPlus,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProcurationForm from '@/components/procuration/ProcurationForm';
import { proxyFormDefaultValues, type ProxyFormValues } from '@/utils/proxyForm';
import type { ProxyRequest } from '@/types/proxy.types';

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function AdminProcurationPage() {
  const [requesters, setRequesters] = useState<ProxyRequest[]>([]);
  const [volunteers, setVolunteers] = useState<ProxyRequest[]>([]);
  const [matches, setMatches] = useState<Array<{
    id: string;
    requester_id: string;
    volunteer_id: string;
    status: string;
    confirmed_at: string | null;
    created_at: string;
    requester?: ProxyRequest;
    volunteer?: ProxyRequest;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequesterId, setSelectedRequesterId] = useState<string>('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [confirmingMatchId, setConfirmingMatchId] = useState<string | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [breakMatchId, setBreakMatchId] = useState<string | null>(null);
  const [breakingMatchId, setBreakingMatchId] = useState<string | null>(null);
  const [disableTarget, setDisableTarget] = useState<{
    id: string;
    type: 'requester' | 'volunteer';
    inMatch: boolean;
    otherId?: string;
    matchId?: string;
  } | null>(null);
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [reenableTarget, setReenableTarget] = useState<{ id: string; type: 'requester' | 'volunteer' } | null>(null);
  const [reenablingId, setReenablingId] = useState<string | null>(null);
  type StatusFilter = 'pending' | 'matched' | 'all';
  const [requesterStatusFilter, setRequesterStatusFilter] = useState<StatusFilter>('pending');
  const [volunteerStatusFilter, setVolunteerStatusFilter] = useState<StatusFilter>('pending');
  const [showDisabledRequesters, setShowDisabledRequesters] = useState(false);
  const [showDisabledVolunteers, setShowDisabledVolunteers] = useState(false);
  const [editTarget, setEditTarget] = useState<ProxyRequest | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  function proxyRequestToFormValues(r: ProxyRequest): Partial<ProxyFormValues> {
    return {
      firstName: r.first_name,
      lastName: r.last_name,
      nationalElectorNumber: r.national_elector_number,
      phone: r.phone,
      email: r.email,
      votingBureau: r.voting_bureau ?? null,
      supportCommitteeConsent: r.support_committee_consent,
      newsletterConsent: r.newsletter_consent,
    };
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, volRes, matchRes] = await Promise.all([
        supabase
          .from('proxy_requests')
          .select('*')
          .eq('type', 'requester')
          .order('created_at', { ascending: false }),
        supabase
          .from('proxy_requests')
          .select('*')
          .eq('type', 'volunteer')
          .order('created_at', { ascending: false }),
        supabase
          .from('proxy_matches')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (reqRes.error) throw reqRes.error;
      if (volRes.error) throw volRes.error;
      if (matchRes.error) throw matchRes.error;

      setRequesters((reqRes.data || []) as ProxyRequest[]);
      setVolunteers((volRes.data || []) as ProxyRequest[]);

      const matchList = matchRes.data || [];
      const reqIds = [...new Set(matchList.map((m: { requester_id: string }) => m.requester_id))];
      const volIds = [...new Set(matchList.map((m: { volunteer_id: string }) => m.volunteer_id))];
      const allReqs = [...(reqRes.data || []), ...(volRes.data || [])] as ProxyRequest[];

      setMatches(
        matchList.map((m: { id: string; requester_id: string; volunteer_id: string; status: string; confirmed_at: string | null; created_at: string }) => ({
          ...m,
          requester: allReqs.find((r) => r.id === m.requester_id),
          volunteer: allReqs.find((r) => r.id === m.volunteer_id),
        }))
      );
    } catch (e: unknown) {
      console.error(e);
      toast.error('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingRequesterIds = new Set(
    matches.filter((m) => m.status === 'pending' || m.status === 'confirmed').map((m) => m.requester_id)
  );
  const pendingVolunteerIds = new Set(
    matches.filter((m) => m.status === 'pending' || m.status === 'confirmed').map((m) => m.volunteer_id)
  );
  const availableRequesters = requesters.filter(
    (r) => !(r.disabled ?? false) && !pendingRequesterIds.has(r.id)
  );
  const availableVolunteers = volunteers.filter(
    (v) => !(v.disabled ?? false) && !pendingVolunteerIds.has(v.id)
  );

  const filteredRequesters = requesters.filter((r) => {
    if (!showDisabledRequesters && (r.disabled ?? false)) return false;
    if (requesterStatusFilter === 'pending') return r.status === 'pending';
    if (requesterStatusFilter === 'matched') return r.status === 'matched';
    return true;
  });
  const filteredVolunteers = volunteers.filter((v) => {
    if (!showDisabledVolunteers && (v.disabled ?? false)) return false;
    if (volunteerStatusFilter === 'pending') return v.status === 'pending';
    if (volunteerStatusFilter === 'matched') return v.status === 'matched';
    return true;
  });

  const handleCreateMatch = async () => {
    if (
      !selectedRequesterId ||
      !selectedVolunteerId ||
      selectedRequesterId.startsWith('__none') ||
      selectedVolunteerId.startsWith('__none')
    ) {
      toast.error('Veuillez sélectionner un mandant et un mandataire.');
      return;
    }
    setCreatingMatch(true);
    try {
      const { data: match, error: insertError } = await supabase
        .from('proxy_matches')
        .insert({
          requester_id: selectedRequesterId,
          volunteer_id: selectedVolunteerId,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!match) throw new Error('Match non créé');

      setSelectedRequesterId('');
      setSelectedVolunteerId('');
      toast.success('Binôme créé. Confirmez le match pour envoyer les emails.');
      await fetchData();
    } catch (e: unknown) {
      console.error(e);
      toast.error('Impossible de créer le binôme.');
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleConfirmMatch = async (matchId: string) => {
    setConfirmingMatchId(matchId);
    try {
      const match = matches.find((m) => m.id === matchId);
      if (!match?.requester || !match?.volunteer) {
        toast.error('Données du match manquantes.');
        return;
      }

      const response = await fetch(
        `${VITE_SUPABASE_URL}/functions/v1/proxy-match-notify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            matchId,
            requester: {
              id: match.requester.id,
              first_name: match.requester.first_name,
              last_name: match.requester.last_name,
              national_elector_number: match.requester.national_elector_number,
              phone: match.requester.phone,
              email: match.requester.email,
            },
            volunteer: {
              id: match.volunteer.id,
              first_name: match.volunteer.first_name,
              last_name: match.volunteer.last_name,
              national_elector_number: match.volunteer.national_elector_number,
              phone: match.volunteer.phone,
              email: match.volunteer.email,
            },
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || result?.error) {
        throw new Error(result?.error ?? result?.message ?? 'Erreur lors de l\'envoi des emails');
      }

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.data?.session?.user?.id ?? null;

      const { error: updateMatchError } = await supabase
        .from('proxy_matches')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: userId,
        })
        .eq('id', matchId);

      if (updateMatchError) throw updateMatchError;

      await supabase
        .from('proxy_requests')
        .update({ status: 'matched' })
        .in('id', [match.requester.id, match.volunteer.id]);

      toast.success('Match confirmé. Les emails ont été envoyés.');
      await fetchData();
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la confirmation.');
    } finally {
      setConfirmingMatchId(null);
    }
  };

  const handleBreakMatch = async (matchId: string) => {
    setBreakingMatchId(matchId);
    try {
      const match = matches.find((m) => m.id === matchId);
      if (!match) throw new Error('Match introuvable.');
      const { error: deleteError } = await supabase.from('proxy_matches').delete().eq('id', matchId);
      if (deleteError) throw deleteError;
      const { error: updateError } = await supabase
        .from('proxy_requests')
        .update({ status: 'pending' })
        .in('id', [match.requester_id, match.volunteer_id]);
      if (updateError) throw updateError;
      toast.success('Binôme cassé. Les deux personnes sont de nouveau en attente.');
      setBreakMatchId(null);
      await fetchData();
    } catch (e: unknown) {
      console.error(e);
      toast.error('Impossible de casser le binôme.');
    } finally {
      setBreakingMatchId(null);
    }
  };

  const openDisableDialog = (id: string, type: 'requester' | 'volunteer') => {
    const match = matches.find(
      (m) => m.requester_id === id || m.volunteer_id === id
    );
    setDisableTarget({
      id,
      type,
      inMatch: !!match,
      otherId: match ? (match.requester_id === id ? match.volunteer_id : match.requester_id) : undefined,
      matchId: match?.id,
    });
  };

  const handleDisablePerson = async () => {
    if (!disableTarget) return;
    setDisablingId(disableTarget.id);
    try {
      if (disableTarget.inMatch && disableTarget.matchId) {
        const match = matches.find((m) => m.id === disableTarget.matchId);
        if (match) {
          await supabase.from('proxy_matches').delete().eq('id', disableTarget.matchId);
          if (disableTarget.otherId) {
            await supabase
              .from('proxy_requests')
              .update({ status: 'pending' })
              .eq('id', disableTarget.otherId);
          }
        }
      }
      const { error } = await supabase
        .from('proxy_requests')
        .update({ disabled: true })
        .eq('id', disableTarget.id);
      if (error) throw error;
      toast.success('Personne désactivée. Elle n\'apparaîtra plus dans les listes de matching.');
      setDisableTarget(null);
      await fetchData();
    } catch (e: unknown) {
      console.error(e);
      toast.error('Impossible de désactiver.');
    } finally {
      setDisablingId(null);
    }
  };

  const handleReenablePerson = async () => {
    if (!reenableTarget) return;
    setReenablingId(reenableTarget.id);
    try {
      const { error } = await supabase
        .from('proxy_requests')
        .update({ disabled: false })
        .eq('id', reenableTarget.id);
      if (error) throw error;
      toast.success('Personne réactivée.');
      setReenableTarget(null);
      await fetchData();
    } catch (e: unknown) {
      console.error(e);
      toast.error('Impossible de réactiver.');
    } finally {
      setReenablingId(null);
    }
  };

  const handleSaveEdit = async (values: ProxyFormValues) => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('proxy_requests')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          national_elector_number: values.nationalElectorNumber,
          phone: values.phone,
          email: values.email,
          voting_bureau: values.votingBureau ?? null,
          support_committee_consent: values.supportCommitteeConsent,
          newsletter_consent: values.newsletterConsent,
        })
        .eq('id', editTarget.id);
      if (error) throw error;
      toast.success('Fiche mise à jour.');
      setEditTarget(null);
      await fetchData();
    } catch (e: unknown) {
      console.error(e);
      toast.error('Impossible d\'enregistrer les modifications.');
    } finally {
      setSavingEdit(false);
    }
  };

  const renderRequestRow = (
    r: ProxyRequest,
    showStatus: boolean,
    type: 'requester' | 'volunteer',
    _label: string
  ) => {
    const isDisabled = r.disabled ?? false;
    return (
      <TableRow key={r.id} className={isDisabled ? 'opacity-70' : undefined}>
        <TableCell className="font-medium">
          {r.first_name} {r.last_name}
        </TableCell>
        <TableCell className="font-mono text-xs">{r.national_elector_number}</TableCell>
        <TableCell>{r.phone}</TableCell>
        <TableCell>{r.email}</TableCell>
        <TableCell>{r.voting_bureau != null ? `Bureau ${r.voting_bureau}` : '—'}</TableCell>
        {showStatus && (
          <TableCell>
            <div className="flex flex-wrap gap-1">
              {isDisabled && (
                <Badge variant="outline" className="border-amber-500 text-amber-700">Désactivé</Badge>
              )}
              {!isDisabled && (
                <Badge variant={r.status === 'matched' ? 'secondary' : 'default'}>{r.status}</Badge>
              )}
            </div>
          </TableCell>
        )}
        <TableCell className="text-gray-500 text-sm">
          {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditTarget(r)}
              disabled={savingEdit}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            {isDisabled ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReenableTarget({ id: r.id, type })}
                disabled={reenablingId === r.id}
              >
                {reenablingId === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Réactiver
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDisableDialog(r.id, type)}
                disabled={disablingId === r.id}
              >
                {disablingId === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-1" />
                    Désactiver
                  </>
                )}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Procuration | Administration | Gétigné Collectif</title>
      </Helmet>
      <AdminLayout
        title="Procuration"
        description="Associer les demandes (mandants) et les propositions (mandataires), puis confirmer pour envoyer les emails."
      >
        <div className="space-y-6">
          {/* Créer un match */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Créer un binôme
              </CardTitle>
              <CardDescription>
                Choisissez un mandant (personne qui cherche quelqu'un pour voter pour elle) et un mandataire (personne qui porte la procuration). Les personnes déjà associées n'apparaissent pas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 min-w-[200px]">
                <label className="text-sm font-medium">Mandant</label>
                <Select value={selectedRequesterId} onValueChange={setSelectedRequesterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mandant" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRequesters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.first_name} {r.last_name} – {r.email}
                      </SelectItem>
                    ))}
                    {availableRequesters.length === 0 && (
                      <SelectItem value="__none_requester" disabled>
                        Aucun mandant disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-[200px]">
                <label className="text-sm font-medium">Mandataire</label>
                <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mandataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVolunteers.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.first_name} {v.last_name} – {v.email}
                      </SelectItem>
                    ))}
                    {availableVolunteers.length === 0 && (
                      <SelectItem value="__none_volunteer" disabled>
                        Aucun mandataire disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateMatch}
                disabled={creatingMatch || !selectedRequesterId || !selectedVolunteerId}
              >
                {creatingMatch ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer le binôme'}
              </Button>
            </CardContent>
          </Card>

          {/* Liste des matchs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Binômes ({matches.length})
              </CardTitle>
              <CardDescription>
                Confirmer un match envoie un email au mandant et au mandataire avec les coordonnées de l'autre et les instructions pour maprocuration.gouv.fr.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mandant</TableHead>
                      <TableHead>Mandataire</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : matches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Aucun binôme pour l'instant.
                        </TableCell>
                      </TableRow>
                    ) : (
                      matches.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            {m.requester
                              ? `${m.requester.first_name} ${m.requester.last_name} (${m.requester.email})`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {m.volunteer
                              ? `${m.volunteer.first_name} ${m.volunteer.last_name} (${m.volunteer.email})`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={m.status === 'confirmed' ? 'secondary' : 'default'}>
                              {m.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {format(new Date(m.created_at), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap gap-2 justify-end">
                              {m.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmMatch(m.id)}
                                  disabled={confirmingMatchId === m.id}
                                >
                                  {confirmingMatchId === m.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Mail className="h-4 w-4 mr-1" />
                                      Confirmer et envoyer les emails
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setBreakMatchId(m.id)}
                                disabled={!!breakingMatchId}
                              >
                                {breakingMatchId === m.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Unlink className="h-4 w-4 mr-1" />
                                    Casser le binôme
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Liste des demandes (mandants) */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Mandants ({filteredRequesters.length}
                    {requesterStatusFilter !== 'all' ? ` / ${requesters.length}` : ''})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Personnes qui cherchent quelqu'un pour voter à leur place.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Select value={requesterStatusFilter} onValueChange={(v) => setRequesterStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente (non matchés)</SelectItem>
                      <SelectItem value="matched">Matchés</SelectItem>
                      <SelectItem value="all">Tous</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={showDisabledRequesters}
                      onCheckedChange={(checked) => setShowDisabledRequesters(checked === true)}
                    />
                    Afficher les désactivés
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>NNE</TableHead>
                      <TableHead>Tél.</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequesters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                          {requesters.length === 0 ? 'Aucune demande.' : 'Aucun mandant pour ce filtre.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequesters.map((r) => renderRequestRow(r, true, 'requester', 'mandant'))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Liste des volontaires (mandataires) */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Mandataires ({filteredVolunteers.length}
                    {volunteerStatusFilter !== 'all' ? ` / ${volunteers.length}` : ''})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Personnes disponibles pour porter une procuration.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Select value={volunteerStatusFilter} onValueChange={(v) => setVolunteerStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente (non matchés)</SelectItem>
                      <SelectItem value="matched">Matchés</SelectItem>
                      <SelectItem value="all">Tous</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={showDisabledVolunteers}
                      onCheckedChange={(checked) => setShowDisabledVolunteers(checked === true)}
                    />
                    Afficher les désactivés
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>NNE</TableHead>
                      <TableHead>Tél.</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                          {volunteers.length === 0 ? 'Aucune proposition.' : 'Aucun mandataire pour ce filtre.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVolunteers.map((v) => renderRequestRow(v, true, 'volunteer', 'mandataire'))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog : casser un binôme */}
        <AlertDialog open={!!breakMatchId} onOpenChange={(open) => !open && setBreakMatchId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Casser ce binôme ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le mandant et le mandataire retrouveront le statut « en attente » et pourront être
                à nouveau associés à quelqu&apos;un d&apos;autre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!breakingMatchId}>Annuler</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={!!breakingMatchId}
                onClick={() => {
                  if (breakMatchId) {
                    handleBreakMatch(breakMatchId);
                  }
                }}
              >
                {breakingMatchId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Casser le binôme'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog : désactiver un mandant/mandataire */}
        <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Désactiver cette personne ?</AlertDialogTitle>
              <AlertDialogDescription>
                {disableTarget?.inMatch
                  ? "Cette personne est dans un binôme. La désactiver cassera ce binôme : l'autre personne retrouvera le statut « en attente ». La personne désactivée n'apparaîtra plus dans les listes de matching."
                  : "Elle n'apparaîtra plus dans les listes de matching (création de binôme). Vous pourrez la réactiver plus tard."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!disablingId}>Annuler</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={!!disablingId}
                onClick={handleDisablePerson}
              >
                {disablingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Désactiver'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog : réactiver */}
        <AlertDialog open={!!reenableTarget} onOpenChange={(open) => !open && setReenableTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Réactiver cette personne ?</AlertDialogTitle>
              <AlertDialogDescription>
                Elle réapparaîtra dans les listes de matching et pourra à nouveau être associée à un
                binôme.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!reenablingId}>Annuler</AlertDialogCancel>
              <Button disabled={!!reenablingId} onClick={handleReenablePerson}>
                {reenablingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Réactiver'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog : modifier une fiche proxy_request */}
        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Modifier la fiche {editTarget?.type === 'requester' ? 'mandant' : 'mandataire'}
              </DialogTitle>
            </DialogHeader>
            {editTarget && (
              <ProcurationForm
                key={editTarget.id}
                type={editTarget.type}
                defaultValues={{ ...proxyFormDefaultValues, ...proxyRequestToFormValues(editTarget) }}
                submitLabel="Enregistrer"
                onSubmit={handleSaveEdit}
              />
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </HelmetProvider>
  );
}
