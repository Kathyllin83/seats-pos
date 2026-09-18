import { useEffect, useRef } from 'react';
import { IonApp, IonContent, IonPage } from '@ionic/react';
import { SeatingChart } from 'reservaqui';
import type { PricingRule, SeatingCategory } from 'reservaqui';

const WORKSPACE_KEY = 'reservaqui_wpk_3zryuywhrxwaznxobirqdfbmcpkvqe1e65f2giyf';
const EVENT_ID = '01a0a659-de6f-72ad-ba14-83b0b0800306';
const BASE_URL = import.meta.env.VITE_RESERVAQUI_BASE_URL ?? '';

const ticketTypes = [
  { id: 'inteira', label: 'Inteira', price: 10000, currency: 'BRL' as const, color: '#2563eb' },
  { id: 'meia', label: 'Meia', price: 5000, currency: 'BRL' as const, color: '#16a34a' },
];

const buildPricing = (categories: SeatingCategory[]): PricingRule[] => categories
  .filter((category) => category.id !== null && category.id !== undefined)
  .map((category) => ({ categoryId: category.id, ticketTypes }));

export default function App() {
  const chartRef = useRef<SeatingChart | null>(null);
  const applyPricing = (chart: SeatingChart, categories: SeatingCategory[]) => {
    const pricing = buildPricing(categories);
    if (pricing.length === 0) return false;
    chart.setPricing(pricing);
    return true;
  };

  const loadMap = () => {
    if (!BASE_URL) {
      console.error('Defina VITE_RESERVAQUI_BASE_URL no arquivo .env para conectar ao servidor Reserva Aqui.');
      return;
    }

    chartRef.current?.destroy();
    const chart = new SeatingChart({
      divId: 'seat-map',
      baseUrl: BASE_URL,
      workspaceKey: WORKSPACE_KEY,
      event: EVENT_ID,
      mode: 'simplified',
      height: '100dvh',
      onReady: (eventId, _objectKeys, categories = []) => {
        const officialCategories = categories.length > 0 ? categories : chart.getCategories();
        if (!applyPricing(chart, officialCategories)) {
          console.warn(`Nenhuma categoria recebida para o evento ${eventId}`);
        }
      },
      onSelectionChanged: (seatIds, ticketTypesBySeat, objectKeys, items, pricingSelection) => {
        console.log('Tipos disponíveis:', ticketTypesBySeat);
        console.log('Seleção de preços:', pricingSelection);
        console.log('Objetos selecionados:', { objectKeys, items });
      },
      onError: (_action, message) => {
        console.error('Reserva Aqui:', message);
      },
    }).render();
    chartRef.current = chart;
  };

  useEffect(() => {
    loadMap();
    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen><div id="seat-map" /></IonContent>
      </IonPage>
    </IonApp>
  );
}
