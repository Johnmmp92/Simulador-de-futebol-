import { AppData } from './types';

const JSONBLOB_API_BASE = 'https://jsonblob.com/api/jsonBlob';

/**
 * Extracts the blob ID from a jsonblob.com URI.
 * Handles both user-facing (e.g., https://jsonblob.com/id) and API URIs.
 * @param uri The URI to parse.
 * @returns The blob ID, or null if the URI is invalid or not from jsonblob.com.
 */
function getBlobIdFromUri(uri: string): string | null {
    try {
        const url = new URL(uri);
        if (url.hostname !== 'jsonblob.com') {
            return null; // Not a jsonblob URI, could be old service or invalid
        }
        // The pathname will be like "/<id>" or "/api/jsonBlob/<id>"
        const pathParts = url.pathname.split('/');
        // The ID is always the last non-empty part of the path.
        const id = pathParts.filter(p => p).pop();
        return id || null;
    } catch (e) {
        console.error("Erro ao analisar URI do blob:", e);
        return null;
    }
}

export async function loadData(blobUri: string): Promise<any | null> {
    if (!blobUri) {
        console.warn("loadData foi chamado sem um blobUri.");
        return null;
    }
    
    // Check if it's an old npoint.io link for migration
    if (blobUri.includes('api.npoint.io/bins')) {
         try {
            console.log(`Carregando dados do URI npoint.io legado: ${blobUri}`);
            const response = await fetch(blobUri);
            if (!response.ok) throw new Error(`Falha ao carregar dados legados: ${response.statusText}`);
            console.log("Dados legados carregados com sucesso. Serão migrados no próximo salvamento.");
            return await response.json();
        } catch (error) {
            console.error("Erro ao carregar dados do npoint.io legado:", error);
            return null;
        }
    }
    
    const id = getBlobIdFromUri(blobUri);
    if (!id) {
        console.warn(`Tentativa de carregar URI de serviço antigo/incorreto: ${blobUri}. Por favor, gere um novo código.`);
        return null;
    }

    try {
        const apiUrl = `${JSONBLOB_API_BASE}/${id}`;
        console.log(`Tentando carregar dados do jsonblob.com URI: ${apiUrl}`);
        const response = await fetch(apiUrl);

        if (response.status === 404) {
            console.warn("jsonblob.com URI não encontrado. Pode ter sido excluído ou ser inválido.");
            return null;
        }

        if (!response.ok) {
            throw new Error(`Falha ao carregar dados do jsonblob.com: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        console.log("Dados carregados com sucesso do jsonblob.com.");
        return data;

    } catch (error) {
        console.error("Erro ao carregar dados do jsonblob.com:", error);
        return null;
    }
}

export async function saveData(data: any, blobUri: string | null): Promise<string> {
    const blobId = blobUri ? getBlobIdFromUri(blobUri) : null;
    
    // If we have an ID, we update (PUT), otherwise we create (POST).
    // This also handles migration: if the old URI is from npoint.io, getBlobIdFromUri returns null,
    // which correctly triggers a POST to create a new blob on jsonblob.com.
    const url = blobId ? `${JSONBLOB_API_BASE}/${blobId}` : JSONBLOB_API_BASE;
    const method = blobId ? 'PUT' : 'POST';

    try {
        console.log(`Salvando dados para jsonblob.com via ${method} em ${url}`);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
             if (method === 'PUT' && response.status === 404) {
                 // The blob doesn't exist anymore, which can happen if it's deleted.
                 throw new Error('Blob not found'); 
            }
            throw new Error(`Falha ao salvar dados para jsonblob.com: ${response.statusText} (${response.status})`);
        }
        
        if (method === 'POST') {
            const newUri = response.headers.get('Location');
            if (!newUri) {
                throw new Error('Nenhum cabeçalho de Localização encontrado na resposta de criação do jsonblob.com.');
            }
            // The location header returns the full API url, but we want to store the user-facing one.
            const userFacingUri = newUri.replace('/api/jsonBlob', '');
            console.log(`Dados salvos no novo bin jsonblob.com: ${userFacingUri}`);
            return userFacingUri;
        } else {
            console.log(`Dados atualizados no jsonblob.com: ${blobUri}`);
            // If we successfully PUT, the URI doesn't change.
            return blobUri!;
        }

    } catch (error) {
        console.error("Erro ao salvar dados para jsonblob.com:", error);
        throw error;
    }
}