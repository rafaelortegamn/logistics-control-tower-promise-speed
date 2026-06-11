import { useEffect, useState } from "react";
import Papa from "papaparse";

const parseCsv = async (path) => {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo: ${path}`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors?.length) {
          console.warn(`Advertencias al leer ${path}:`, results.errors);
        }

        resolve(results.data);
      },
      error: (error) => reject(error),
    });
  });
};

export function useCsvData() {
  const [data, setData] = useState({
    envios: [],
    eventos: [],
    segmentos: [],
    responsables: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [envios, eventos, segmentos, responsables] = await Promise.all([
          parseCsv("/data/envios_mock.csv"),
          parseCsv("/data/eventos_envio_mock.csv"),
          parseCsv("/data/segmentos_mock.csv"),
          parseCsv("/data/responsables_mock.csv"),
        ]);

        setData({
          envios,
          eventos,
          segmentos,
          responsables,
          loading: false,
          error: null,
        });
      } catch (error) {
        setData({
          envios: [],
          eventos: [],
          segmentos: [],
          responsables: [],
          loading: false,
          error,
        });
      }
    }

    loadData();
  }, []);

  return data;
}