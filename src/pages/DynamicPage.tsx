
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@/styles/richTextContent.css';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  parent?: Page;
}

interface BreadcrumbPageItem {
  id: string;
  title: string;
  slug: string;
}

const DynamicPage = () => {
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbPageItem[]>([]);

  // Extract the full path from the location pathname
  // The format will be /pages/parent-slug/child-slug/etc
  useEffect(() => {
    const fetchPageByPath = async () => {
      setLoading(true);
      try {
        // Split the path and remove empty segments
        const pathParts = location.pathname.split('/').filter(Boolean);
        
        // Remove the "pages" part
        if (pathParts[0] === 'pages') {
          pathParts.shift();
        }
        
        // If there are no remaining parts, show an error
        if (pathParts.length === 0) {
          setError('Page non trouvée');
          setLoading(false);
          return;
        }
        
        // The last part of the path is the current page slug
        const currentSlug = pathParts[pathParts.length - 1];
        
        console.log('Fetching page with slug:', currentSlug);
        console.log('Full path parts:', pathParts);
        
        // First, try to fetch the page directly by slug
        const { data: pageData, error: pageError } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', currentSlug)
          .eq('status', 'published')
          .single();
          
        if (pageError || !pageData) {
          setError('Page non trouvée');
          setLoading(false);
          return;
        }
        
        // If we found the page, now check if its hierarchy matches the URL path
        if (pathParts.length > 1) {
          // We need to verify the hierarchy by traversing up the parent chain
          let currentPage = pageData;
          let hierarchyPath = [currentSlug];
          
          // Build the actual hierarchy of the page
          while (currentPage.parent_id) {
            const { data: parentData, error: parentError } = await supabase
              .from('pages')
              .select('*')
              .eq('id', currentPage.parent_id)
              .single();
              
            if (parentError || !parentData) break;
            
            hierarchyPath.unshift(parentData.slug);
            currentPage = parentData;
          }
          
          console.log('Expected path:', pathParts);
          console.log('Actual hierarchy:', hierarchyPath);
          
          // Check if the URL path matches the actual hierarchy
          const isValidPath = pathParts.length === hierarchyPath.length && 
            pathParts.every((part, index) => part === hierarchyPath[index]);
            
          if (!isValidPath) {
            setError('Page non trouvée - chemin incorrect');
            setLoading(false);
            return;
          }
        }
        
        setPage(pageData);
        setError(null);
        fetchBreadcrumbItems(pageData.id, pageData.parent_id);
      } catch (error: any) {
        console.error('Error fetching page:', error);
        setError('Impossible de charger la page');
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPageByPath();
  }, [location.pathname]);

  const fetchBreadcrumbItems = async (currentPageId: string, parentId: string | null) => {
    if (!parentId) {
      setBreadcrumbItems([]);
      return;
    }

    try {
      const breadcrumbPath: BreadcrumbPageItem[] = [];
      let currentParentId = parentId;

      while (currentParentId) {
        const { data, error } = await supabase
          .from('pages')
          .select('id, title, slug, parent_id')
          .eq('id', currentParentId)
          .single();

        if (error || !data) break;

        breadcrumbPath.unshift({
          id: data.id,
          title: data.title,
          slug: data.slug
        });

        currentParentId = data.parent_id;
      }

      setBreadcrumbItems(breadcrumbPath);
    } catch (error) {
      console.error('Error building breadcrumb:', error);
    }
  };

  // Helper function to build page URL with full hierarchy
  const getPageUrl = (slug: string, items: BreadcrumbPageItem[]) => {
    const path = items.map(item => item.slug).join('/');
    return path ? `/pages/${path}/${slug}` : `/pages/${slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 pt-24 pb-16">
          <div className="flex justify-center items-center h-64">
            <p>Chargement de la page...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 pt-24 pb-16">
          <div className="flex flex-col justify-center items-center h-64">
            <h1 className="text-2xl font-bold mb-4">Page non trouvée</h1>
            <p className="text-muted-foreground mb-8">La page que vous recherchez n'existe pas ou n'est pas disponible.</p>
            <Link to="/" className="text-getigne-accent hover:underline">
              Retour à l'accueil
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{page.title} | Gétigné Collectif</title>
        <meta name="description" content={page.content.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 pt-24 pb-16">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={getPageUrl(item.slug, breadcrumbItems.slice(0, index))}>
                        {item.title}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </React.Fragment>
              ))}
              
              <BreadcrumbItem>
                <BreadcrumbLink>{page.title}</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="prose prose-getigne max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
            <Separator className="mb-8" />
            
            <div className="rich-text-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {page.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default DynamicPage;
