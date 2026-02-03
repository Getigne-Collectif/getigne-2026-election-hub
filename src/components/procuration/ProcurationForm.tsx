import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { proxyFormSchema, proxyFormDefaultValues, type ProxyFormValues } from '@/utils/proxyForm';
import type { ProxyRequestType } from '@/types/proxy.types';
import { Loader2 } from 'lucide-react';

interface ProcurationFormProps {
  type: ProxyRequestType;
  onSubmit: (values: ProxyFormValues) => Promise<void>;
  submitLabel: string;
  /** Valeurs partagées avec l'autre onglet (pré-remplissage) */
  defaultValues?: Partial<ProxyFormValues>;
  /** Appelé à chaque changement pour garder les données en sync entre les deux onglets */
  onValuesChange?: (values: ProxyFormValues) => void;
}

export default function ProcurationForm({ type, onSubmit, submitLabel, defaultValues: defaultValuesProp, onValuesChange }: ProcurationFormProps) {
  const form = useForm<ProxyFormValues>({
    resolver: zodResolver(proxyFormSchema),
    defaultValues: { ...proxyFormDefaultValues, ...defaultValuesProp },
  });

  useEffect(() => {
    if (!onValuesChange) return;
    const subscription = form.watch((values) => {
      onValuesChange(values as ProxyFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, onValuesChange]);

  const handleSubmit = async (values: ProxyFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom *</FormLabel>
                <FormControl>
                  <Input placeholder="Votre prénom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Votre nom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nationalElectorNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro national d'électeur/électrice (NNE) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 12345678901234"
                  inputMode="numeric"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Indiqué sur votre carte d'électeur/électrice (chiffres uniquement, sans espace).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone *</FormLabel>
              <FormControl>
                <Input placeholder="06 12 34 56 78" type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input placeholder="votre@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="votingBureau"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bureau de vote (optionnel)</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === '__unknown' || !v ? null : (Number(v) as 1 | 2 | 3))}
                value={field.value != null ? String(field.value) : '__unknown'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un bureau" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__unknown">Je ne sais pas</SelectItem>
                  <SelectItem value="1">Bureau 1</SelectItem>
                  <SelectItem value="2">Bureau 2</SelectItem>
                  <SelectItem value="3">Bureau 3</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                À Gétigné, les bureaux de vote sont numérotés 1, 2 ou 3.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supportCommitteeConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">
                  Je souhaite signer le comité de soutien si ce n'est pas déjà fait.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newsletterConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">
                  Je souhaite m'abonner à la newsletter pour rester informé(e).
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </Form>
  );
}
