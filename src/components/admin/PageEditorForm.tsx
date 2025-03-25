
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import MarkdownEditor from '@/components/MarkdownEditor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Page, FormValues, usePageEditor } from '@/hooks/usePageEditor';

interface PageEditorFormProps {
  id?: string;
}

const PageEditorForm: React.FC<PageEditorFormProps> = ({ id }) => {
  const navigate = useNavigate();
  const {
    form,
    pages,
    isEditMode,
    isSubmitting,
    handleTitleChange,
    handleSaveAsDraft,
    handlePublish
  } = usePageEditor(id);

  return (
    <div className="py-8">
      <Form {...form}>
        <form>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl font-bold">Titre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Titre de la page"
                        className="text-lg p-3"
                        {...field}
                        onChange={handleTitleChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl font-bold">Contenu</FormLabel>
                    <FormControl>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-[600px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-getigne-100 p-6 space-y-6 sticky top-24">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Paramètres de publication</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={form.handleSubmit(handleSaveAsDraft)}
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Brouillon
                    </Button>
                    <Button
                      onClick={form.handleSubmit(handlePublish)}
                      disabled={isSubmitting}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Publier
                    </Button>
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">/</span>
                        <FormControl>
                          <Input
                            placeholder="url-de-la-page"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page parente</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                          defaultValue="none"
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Aucun parent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun parent</SelectItem>
                            {pages
                              .filter(page => isEditMode ? page.id !== id : true)
                              .map(page => (
                                <SelectItem key={page.id} value={page.id}>
                                  {page.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PageEditorForm;
