import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import FacebookIcon from '@/components/icons/facebook.svg?react';
import GoogleIcon from '@/components/icons/google.svg?react';
import { DiscordLogoIcon } from '@radix-ui/react-icons';
import { Mail } from 'lucide-react';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';

const signUpSchema = z.object({
  first_name: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  last_name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Veuillez entrer une adresse email valide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
});

const signInSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse email valide' }),
  password: z.string().min(1, { message: 'Veuillez entrer votre mot de passe' })
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type SignInFormValues = z.infer<typeof signInSchema>;

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>('signin');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser, signInWithProvider } = useAuth();

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: ''
    }
  });

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleSignUp = async (values: SignUpFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.first_name,
            last_name: values.last_name
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        setUser(data.user);
        
        await sendDiscordNotification({
          title: `👤 Nouvel utilisateur inscrit`,
          message: `
**Nom**: ${values.first_name} ${values.last_name}
**Email**: ${values.email}
**Date**: ${new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
          `,
          color: DiscordColors.ORANGE,
          username: "Système d'Authentication"
        });
        
        toast({
          title: 'Compte créé avec succès',
          description: 'Votre compte a été créé avec succès.',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur lors de l\'inscription',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (values: SignInFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        setUser(data.user);
        toast({
          title: 'Connexion réussie',
          description: 'Vous êtes maintenant connecté.',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur lors de la connexion',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSsoSignIn = async (provider: 'discord' | 'facebook' | 'google') => {
    try {
      setSsoLoading(provider);
      await signInWithProvider(provider);
    } catch (error: any) {
      toast({
        title: `Erreur lors de la connexion avec ${provider}`,
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setSsoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-16 max-w-lg">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            {activeTab === 'signup' ? 'Créer un compte' : 'Se connecter'}
          </h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="votre@email.fr" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Chargement...' : 'Se connecter'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Ou se connecter avec</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSsoSignIn('discord')}
                    disabled={!!ssoLoading}
                    className="w-full"
                  >
                    {ssoLoading === 'discord' ? 'Chargement...' : <DiscordLogoIcon className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSsoSignIn('facebook')}
                    disabled={!!ssoLoading}
                    className="w-full"
                  >
                    {ssoLoading === 'facebook' ? 'Chargement...' : <span className="h-5 w-5 hover:text-white"><FacebookIcon /></span>}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSsoSignIn('google')}
                    disabled={!!ssoLoading}
                    className="w-full"
                  >
                    {ssoLoading === 'google' ? 'Chargement...' : <span className="h-5 w-5 hover:text-white"><GoogleIcon /></span>}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={signUpForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signUpForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Dupont" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="jean.dupont@example.fr" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Chargement...' : 'Créer un compte'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Ou s'inscrire avec</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSsoSignIn('discord')}
                    disabled={!!ssoLoading}
                    className="w-full"
                  >
                    {ssoLoading === 'discord' ? 'Chargement...' : <DiscordLogoIcon className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSsoSignIn('facebook')}
                    disabled={!!ssoLoading}
                    className="w-full"
                  >
                    {ssoLoading === 'facebook' ? 'Chargement...' : <FacebookIcon className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSsoSignIn('google')}
                    disabled={!!ssoLoading}
                    className="w-full"
                  >
                    {ssoLoading === 'google' ? 'Chargement...' : <GoogleIcon className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AuthPage;
