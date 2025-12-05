import { GoogleGenAI } from "@google/genai";
import { Asset, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAssetsWithGemini = async (assets: Asset[]): Promise<string> => {
  try {
    const criticalAssets = assets.filter(a => a.status === 'warning' || a.status === 'alert');
    
    if (criticalAssets.length === 0) {
      return "## Análise de Sistema\n\nTodos os sistemas estão operando dentro dos parâmetros ideais. Nenhuma ação corretiva imediata é necessária com base na telemetria atual.";
    }

    const prompt = `
      Atue como um Engenheiro de Confiabilidade Sênior da EcoTermo Enterprise.
      Analise os seguintes dados de telemetria de ativos industriais críticos:
      ${JSON.stringify(criticalAssets.map(a => ({
        tag: a.tagSerial,
        modelo: a.modelo,
        aplicacao: a.aplicacao,
        area: a.area,
        dias_operacao: a.dias,
        eficiencia: a.efficiency,
        ultima_manutencao: a.ultimaManut
      })))}

      Forneça um Resumo Executivo conciso seguido de um Plano de Ação.
      Para cada ativo:
      1. Identifique a provável causa raiz da queda de eficiência ou tempo estendido de operação.
      2. Recomende ações específicas de manutenção (ex: Limpeza CIP, troca de gaxetas, compressão do pack de placas).
      3. Estime a urgência baseada nos 'Dias de Operação'.

      Formate a resposta em Markdown limpo e profissional, em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    return response.text || "Não foi possível gerar a análise neste momento.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Erro ao conectar com o serviço de Análise IA. Verifique sua conexão ou cota da API.";
  }
};

export const generateMaintenanceEmail = async (assets: Asset[]): Promise<{subject: string, body: string}> => {
  try {
    const prompt = `
      Você é o Sistema de Gestão de Ativos da EcoTermo Enterprise.
      
      TAREFA: Redigir um e-mail técnico formal para o Gerente de Manutenção referente ao CICLO ANUAL DE MANUTENÇÃO PREVENTIVA.
      
      CONTEXTO: Os seguintes Trocadores de Calor atingiram o marco de 9-12 meses de operação e necessitam de agendamento mandatório para intervenção.
      
      ATIVOS PENDENTES:
      ${JSON.stringify(assets.map(a => ({
        tag: a.tagSerial,
        modelo: a.modelo,
        localizacao: a.area, 
        ultima_intervencao: a.ultimaManut
      })))}

      REQUISITOS DO TEXTO:
      1. Idioma: Português Brasileiro (Formal/Corporativo).
      2. Assunto: Claro, Urgente e contendo "Planejamento Anual".
      3. Corpo: Texto puro (sem markdown). Seja direto. Sugira datas para parada.
      4. Conteúdo: Liste os ativos de forma organizada.
      5. Tom: Profissional, focado em segurança operacional e eficiência térmica.
      
      SAÍDA OBRIGATÓRIA (Separada por "|||"):
      1. Linha de Assunto
      2. Corpo do E-mail
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    const text = response.text || "";
    const parts = text.split("|||");
    
    if (parts.length >= 2) {
      return { subject: parts[0].trim(), body: parts[1].trim() };
    }

    return {
      subject: "ALERTA TÉCNICO: Manutenção Preventiva Anual",
      body: `Prezado Gestor,\n\nIdentificamos ativos críticos necessitando de intervenção imediata devido ao ciclo anual.\n\nFavor verificar o painel de controle EcoTermo.\n\nAtenciosamente,\nSistema EcoTermo`
    };

  } catch (error) {
    console.error("Gemini Email Generation Error:", error);
    return {
      subject: "FALHA SISTÊMICA: Erro na Geração de Alerta",
      body: "Houve uma falha na comunicação com o módulo de IA para gerar o detalhamento técnico. Verifique os logs do sistema."
    };
  }
};

export const generateDataAnalysis = async (dataSample: any[], headers: string[]): Promise<AnalysisResult> => {
  try {
    const prompt = `
      Atue como um Cientista de Dados Sênior e Especialista em BI (Power BI).
      Estou te enviando uma amostra de dados (formato JSON) de equipamentos industriais.
      
      CABEÇALHOS: ${headers.join(', ')}
      AMOSTRA DE DADOS (Primeiras 50 linhas):
      ${JSON.stringify(dataSample.slice(0, 50))}

      TAREFA CRÍTICA DE LIMPEZA DE DADOS:
      Muitos campos como "Modelo" ou "Material" podem estar sujos (ex: "FRONT-10-BASE-V2" e "FRONT-10-BASE" devem ser considerados o mesmo modelo "FRONT-10").
      1. Ao analisar para criar gráficos, AGRUPE categorias similares. Limpe o ruído dos dados.
      2. Analise profundamente correlações (ex: Eficiência vs Tempo de Operação).
      
      OUTPUT REQUERIDO (JSON):
      1. summary: Uma análise textual profunda, identificando ofensores de eficiência e sugestões de melhoria.
      2. kpis: 3 a 4 métricas calculadas importantes.
      3. charts: Configuração para 4 gráficos. 
         - Se sugerir PIE CHART, certifique-se de que a categoria escolhida não tenha mais de 10 valores únicos (agrupe se necessário).
         - Tente variar os tipos (Bar, Line, Area).
      
      RETORNE APENAS JSON VÁLIDO:
      {
        "summary": "texto...",
        "kpis": [{ "label": "...", "value": "...", "trend": "..." }],
        "charts": [
          {
            "type": "pie",
            "title": "Distribuição por Modelo (Agrupado)",
            "dataKey": "count",
            "categoryKey": "modelo_limpo", 
            "description": "..."
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      summary: "Não foi possível gerar a análise automática. Verifique se o arquivo possui dados válidos.",
      kpis: [],
      charts: []
    };
  }
};