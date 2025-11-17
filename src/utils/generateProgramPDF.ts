import jsPDF from 'jspdf';
import type { Tables } from '@/integrations/supabase/types';
import type { ProgramPoint, ProgramFlagshipProject } from '@/types/program.types';
import { editorjsToText } from './editorjsToText';

/**
 * Convertit une image URL en base64 pour inclusion dans le PDF
 */
async function imageToBase64(url: string): Promise<string | null> {
  try {
    if (!url || url.trim() === '') {
      return null;
    }

    const response = await fetch(url, { 
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url} - Status: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.warn(`URL is not an image: ${url}`);
      return null;
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      console.warn(`Image blob is empty: ${url}`);
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (!base64 || base64.length === 0) {
          reject(new Error('Failed to convert image to base64'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => {
        reject(new Error('FileReader error while converting image'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error, 'URL:', url);
    return null;
  }
}

/**
 * Ajoute du texte avec gestion de la pagination et des marges
 */
function addTextWithPagination(
  pdf: jsPDF,
  text: string,
  options: {
    fontSize?: number;
    y?: number;
    lineHeight?: number;
    marginBottom?: number;
    marginTop?: number;
    marginLeft?: number;
    marginRight?: number;
  } = {}
): number {
  const {
    fontSize = 11,
    y = 20,
    lineHeight = 1.2,
    marginBottom = 30,
    marginTop = 20,
    marginLeft = 20,
    marginRight = 20,
  } = options;

  pdf.setFontSize(fontSize);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const effectiveMaxWidth = pageWidth - marginLeft - marginRight;
  
  let currentY = y;
  const lines = pdf.splitTextToSize(text, effectiveMaxWidth);
  
  // Calculer la hauteur d'une ligne en mm (approximation: fontSize en points * lineHeight / 2.83465)
  const lineHeightMM = (fontSize * lineHeight) / 2.83465;
  
  lines.forEach((line: string) => {
    // Vérifier si on dépasse la marge du bas
    if (currentY + lineHeightMM > pageHeight - marginBottom) {
      pdf.addPage();
      currentY = marginTop;
    }
    
    pdf.text(line, marginLeft, currentY);
    currentY += lineHeightMM;
  });
  
  return currentY;
}

/**
 * Ajoute une image avec gestion de la pagination
 */
async function addImageWithPagination(
  pdf: jsPDF,
  imageData: string,
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    marginBottom?: number;
    marginTop?: number;
  } = {}
): Promise<number> {
  const {
    x = 20,
    y = 20,
    width = 170,
    height = 100,
    marginBottom = 30,
    marginTop = 20,
  } = options;

  if (!imageData || imageData.length === 0) {
    console.warn('Empty image data, skipping image');
    return y;
  }

  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = y;
  
  // Vérifier si l'image rentre sur la page
  if (currentY + height > pageHeight - marginBottom) {
    pdf.addPage();
    currentY = marginTop;
  }
  
  try {
    // Détecter le format de l'image depuis le data URL
    let format: 'PNG' | 'JPEG' | 'JPG' = 'JPEG';
    if (imageData.startsWith('data:image/png')) {
      format = 'PNG';
    } else if (imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg')) {
      format = 'JPEG';
    }
    
    pdf.addImage(imageData, format, x, currentY, width, height, undefined, 'FAST');
    return currentY + height + 10;
  } catch (error) {
    console.error('Error adding image to PDF:', error);
    // Retourner la position Y sans ajouter l'image
    return currentY;
  }
}

/**
 * Génère un PDF complet du programme avec texte sélectionnable
 */
export async function generateProgramPDF(
  programGeneral: Tables<'program_general'> | null,
  flagshipProjects: ProgramFlagshipProject[],
  programItems: Array<Tables<'program_items'> & { program_points: ProgramPoint[] }>,
  onProgress?: (message: string) => void
): Promise<void> {
  try {
    onProgress?.('Préparation du contenu...');

    // Créer le PDF en format A4 avec marges
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20;
    const marginBottom = 30; // Marge plus grande en bas
    let currentY = marginTop;

    // Fonction helper pour vérifier et ajouter une nouvelle page si nécessaire
    const checkPageBreak = (requiredHeight: number) => {
      if (currentY + requiredHeight > pageHeight - marginBottom) {
        pdf.addPage();
        currentY = marginTop;
        return true;
      }
      return false;
    };

    // En-tête
    pdf.setFontSize(24);
    pdf.setTextColor(6, 95, 70); // Couleur getigne-accent
    pdf.setFont('helvetica', 'bold');
    currentY = addTextWithPagination(pdf, 'Programme - Objectif 2026', {
      fontSize: 24,
      y: currentY,
      marginBottom,
      marginTop,
      marginLeft,
      marginRight,
    });

    pdf.setFontSize(11);
    pdf.setTextColor(107, 114, 128); // Gris
    pdf.setFont('helvetica', 'normal');
    const dateText = `Gétigné Collectif - Généré le ${new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`;
    currentY = addTextWithPagination(pdf, dateText, {
      fontSize: 11,
      y: currentY + 5,
      marginBottom,
      marginTop,
      marginLeft,
      marginRight,
    });

    // Ligne de séparation
    checkPageBreak(15);
    pdf.setDrawColor(16, 185, 129); // getigne-accent
    pdf.setLineWidth(0.5);
    pdf.line(marginLeft, currentY + 5, pageWidth - marginRight, currentY + 5);
    currentY += 20;

    // Présentation générale
    if (programGeneral) {
      checkPageBreak(30);
      
      // Fond coloré (simulé avec un rectangle)
      pdf.setFillColor(16, 185, 129); // getigne-accent
      pdf.rect(marginLeft, currentY, pageWidth - marginLeft - marginRight, 15, 'F');
      
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Un programme ambitieux, réfléchi et participatif', marginLeft + 5, currentY + 10);
      currentY += 20;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      const generalText = editorjsToText(programGeneral.content || '');
      currentY = addTextWithPagination(pdf, generalText, {
        fontSize: 11,
        y: currentY,
        marginBottom,
        marginTop,
        marginLeft,
        marginRight,
      });
      currentY += 10;
    }

    // Projets phares
    if (flagshipProjects && flagshipProjects.length > 0) {
      checkPageBreak(30);
      
      pdf.setFontSize(20);
      pdf.setTextColor(6, 95, 70);
      pdf.setFont('helvetica', 'bold');
      currentY = addTextWithPagination(pdf, 'Trois projets phares pour l\'avenir', {
        fontSize: 20,
        y: currentY + 10,
        marginBottom,
        marginTop,
        marginLeft,
        marginRight,
      });
      currentY += 5;

      for (let i = 0; i < flagshipProjects.length; i++) {
        const project = flagshipProjects[i];
        checkPageBreak(50);

        // Numéro du projet
        pdf.setFillColor(16, 185, 129);
        pdf.circle(marginLeft + 10, currentY + 5, 5, 'F');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(i + 1).padStart(2, '0'), marginLeft + 6, currentY + 7);

        // Titre du projet
        pdf.setFontSize(16);
        pdf.setTextColor(6, 95, 70);
        pdf.setFont('helvetica', 'bold');
        currentY = addTextWithPagination(pdf, project.title, {
          fontSize: 16,
          y: currentY,
          x: marginLeft + 20,
          marginBottom,
          marginTop,
          marginLeft: marginLeft + 20,
          marginRight,
        });

        // Image du projet si présente
        if (project.image_url) {
          try {
            onProgress?.(`Chargement de l'image du projet ${i + 1}...`);
            const imageData = await imageToBase64(project.image_url);
            if (imageData && imageData.length > 0) {
              checkPageBreak(60);
              currentY = await addImageWithPagination(pdf, imageData, {
                x: marginLeft,
                y: currentY + 5,
                width: pageWidth - marginLeft - marginRight,
                height: 60,
                marginBottom,
                marginTop,
              });
            }
          } catch (error) {
            console.warn(`Failed to load image for project ${i + 1}:`, error);
            // Continuer sans l'image
          }
        }

        // Description
        if (project.description) {
          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          const projectText = editorjsToText(project.description);
          currentY = addTextWithPagination(pdf, projectText, {
            fontSize: 11,
            y: currentY + 5,
            marginBottom,
            marginTop,
            marginLeft,
            marginRight,
          });
        }

        // Timeline si présente
        if (project.timeline && project.timeline.length > 0) {
          checkPageBreak(30);
          pdf.setFontSize(12);
          pdf.setTextColor(6, 95, 70);
          pdf.setFont('helvetica', 'bold');
          currentY = addTextWithPagination(pdf, project.timeline_horizon || 'Calendrier', {
            fontSize: 12,
            y: currentY + 10,
            marginBottom,
            marginTop,
            marginLeft,
            marginRight,
          });

          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          project.timeline.forEach((event) => {
            checkPageBreak(15);
            const eventText = `${event.date_text}: ${event.name}`;
            currentY = addTextWithPagination(pdf, eventText, {
              fontSize: 10,
              y: currentY + 3,
              marginBottom,
              marginTop,
              marginLeft: marginLeft + 10,
              marginRight,
            });
          });
        }

        currentY += 15;
      }
    }

    // Sections avec points
    checkPageBreak(30);
    pdf.setFontSize(20);
    pdf.setTextColor(6, 95, 70);
    pdf.setFont('helvetica', 'bold');
    currentY = addTextWithPagination(pdf, 'Nos mesures pour Gétigné', {
      fontSize: 20,
      y: currentY + 10,
      marginBottom,
      marginTop,
      marginLeft,
      marginRight,
    });
    currentY += 15;

    // Parcourir toutes les sections
    for (const item of programItems) {
      // Filtrer les points validés - inclure tous les points sauf ceux en draft
      const allPoints = item.program_points || [];
      const validatedPoints = allPoints.filter(
        (point) => {
          const status = point.status;
          // Inclure les points validés, pending, ou sans statut (null/undefined)
          // Exclure seulement les drafts
          return status !== 'draft';
        }
      );
      
      // Debug: afficher le nombre de points trouvés
      console.log(`Section "${item.title}": ${allPoints.length} points au total, ${validatedPoints.length} points validés`);

      checkPageBreak(50);

      // Image de section si présente
      if (item.image) {
        try {
          onProgress?.(`Chargement de l'image de la section ${item.title}...`);
          const imageData = await imageToBase64(item.image);
          if (imageData && imageData.length > 0) {
            checkPageBreak(60);
            currentY = await addImageWithPagination(pdf, imageData, {
              x: marginLeft,
              y: currentY + 5,
              width: pageWidth - marginLeft - marginRight,
              height: 50,
              marginBottom,
              marginTop,
            });
          }
        } catch (error) {
          console.warn(`Failed to load image for section ${item.title}:`, error);
          // Continuer sans l'image
        }
      }

      // Titre de section
      checkPageBreak(20);
      pdf.setFontSize(16);
      pdf.setTextColor(6, 95, 70);
      pdf.setFont('helvetica', 'bold');
      currentY = addTextWithPagination(pdf, item.title, {
        fontSize: 16,
        y: currentY + 5,
        marginBottom,
        marginTop,
        marginLeft,
        marginRight,
      });

      // Description de la section
      if (item.description) {
        checkPageBreak(30);
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        const descriptionText = editorjsToText(item.description);
        if (descriptionText.trim()) {
          currentY = addTextWithPagination(pdf, descriptionText, {
            fontSize: 11,
            y: currentY + 5,
            marginBottom,
            marginTop,
            marginLeft,
            marginRight,
          });
        }
      }

      // Points du programme - TOUJOURS afficher s'il y en a
      if (validatedPoints.length > 0) {
        checkPageBreak(20);
        pdf.setFontSize(12);
        pdf.setTextColor(6, 95, 70);
        pdf.setFont('helvetica', 'bold');
        currentY = addTextWithPagination(pdf, 'Points du programme', {
          fontSize: 12,
          y: currentY + 10,
          marginBottom,
          marginTop,
          marginLeft,
          marginRight,
        });

        for (const point of validatedPoints) {
          checkPageBreak(30);

          // Titre du point
          pdf.setFontSize(12);
          pdf.setTextColor(31, 41, 55);
          pdf.setFont('helvetica', 'bold');
          const pointTitle = point.competent_entity
            ? `[${point.competent_entity.name}] ${point.title}`
            : point.title;
          currentY = addTextWithPagination(pdf, pointTitle, {
            fontSize: 12,
            y: currentY + 5,
            marginBottom,
            marginTop,
            marginLeft,
            marginRight,
          });

          // Contenu du point - TOUJOURS afficher même si vide
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          if (point.content) {
            const pointText = editorjsToText(point.content);
            if (pointText.trim()) {
              currentY = addTextWithPagination(pdf, pointText, {
                fontSize: 10,
                y: currentY + 3,
                marginBottom,
                marginTop,
                marginLeft: marginLeft + 5,
                marginRight,
              });
            } else {
              // Si le contenu est vide après conversion, ajouter un espacement minimal
              currentY += 5;
            }
          } else {
            // Si pas de contenu, ajouter un espacement minimal
            currentY += 5;
          }

          // Fichiers attachés
          if (point.files_metadata && point.files_metadata.length > 0) {
            pdf.setFontSize(9);
            pdf.setTextColor(107, 114, 128);
            pdf.setFont('helvetica', 'italic');
            const filesText = `Fichiers: ${point.files_metadata.map((f) => f.label).join(', ')}`;
            currentY = addTextWithPagination(pdf, filesText, {
              fontSize: 9,
              y: currentY + 3,
              marginBottom,
              marginTop,
              marginLeft: marginLeft + 10,
              marginRight,
            });
          }

          currentY += 5;
        }
      }

      // Espacement entre les sections
      currentY += 15;
    }

    // Pied de page sur chaque page
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Programme - Objectif 2026 | Gétigné Collectif - Page ${i}/${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    onProgress?.('Téléchargement...');

    // Télécharger le PDF
    const fileName = `programme-complet-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    onProgress?.('Terminé !');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
