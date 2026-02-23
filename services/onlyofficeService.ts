// ONLYOFFICE Document Editor Service

declare const DocsAPI: any;

export interface OnlyOfficeConfig {
  documentType: 'word' | 'cell' | 'slide';
  document: {
    fileType: string;
    key: string;
    title: string;
    url?: string;
  };
  editorConfig: {
    mode: 'edit' | 'view';
    callbackUrl?: string;
  };
}

let editorInstance: any = null;

export const initOnlyOfficeEditor = (
  containerId: string,
  file: File,
  onDocumentReady: () => void,
  onContentChange: (content: string) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof DocsAPI === 'undefined') {
      reject(new Error('ONLYOFFICE API not loaded'));
      return;
    }

    // Convert file to base64 for local editing
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      // Create unique key for this document
      const docKey = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const config = {
        documentType: 'word',
        document: {
          fileType: file.name.split('.').pop() || 'docx',
          key: docKey,
          title: file.name,
          permissions: {
            edit: true,
            download: true,
            print: true
          }
        },
        editorConfig: {
          mode: 'edit',
          lang: 'en',
          customization: {
            autosave: true,
            forcesave: true,
            compactToolbar: false,
            toolbarNoTabs: false
          },
          events: {
            onDocumentReady: () => {
              console.log('ONLYOFFICE Editor Ready');
              onDocumentReady();
            },
            onDocumentStateChange: (event: any) => {
              console.log('Document changed:', event);
              // Get content when document changes
              if (editorInstance) {
                try {
                  editorInstance.downloadAs('html', (content: string) => {
                    onContentChange(content);
                  });
                } catch (e) {
                  console.warn('Could not extract content:', e);
                }
              }
            }
          }
        },
        width: '100%',
        height: '100%'
      };

      try {
        editorInstance = new DocsAPI.DocEditor(containerId, config);
        resolve(editorInstance);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export const getEditorContent = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!editorInstance) {
      reject(new Error('Editor not initialized'));
      return;
    }

    try {
      editorInstance.downloadAs('html', (content: string) => {
        resolve(content);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const setEditorContent = (html: string): void => {
  if (!editorInstance) {
    console.error('Editor not initialized');
    return;
  }

  // ONLYOFFICE doesn't support direct HTML injection
  // We need to use the API to modify content
  console.warn('Direct content setting not supported in ONLYOFFICE');
};

export const destroyEditor = (): void => {
  if (editorInstance) {
    try {
      editorInstance.destroyEditor();
      editorInstance = null;
    } catch (e) {
      console.warn('Error destroying editor:', e);
    }
  }
};
