import { useEffect, useRef, useState } from 'react';
import { IonApp, IonContent, IonPage, IonSpinner } from '@ionic/react';
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
  const [status, setStatus] = useState('Carregando mapa...');
  const [error, setError] = useState('');

  const applyPricing = (chart: SeatingChart, categories: SeatingCategory[]) => {
    const pricing = buildPricing(categories);
    if (pricing.length === 0) return false;
    chart.setPricing(pricing);
    setStatus('Mapa pronto — escolha seus lugares');
    return true;
  };

  const loadMap = () => {
    setError('');
    if (!BASE_URL) {
      setStatus('Configure a URL do servidor');
      setError('Defina VITE_RESERVAQUI_BASE_URL no arquivo .env para conectar ao servidor Reserva Aqui.');
      return;
    }

    chartRef.current?.destroy();
    const chart = new SeatingChart({
      divId: 'seat-map',
      baseUrl: BASE_URL,
      workspaceKey: WORKSPACE_KEY,
      event: EVENT_ID,
      mode: 'simplified',
      height: 'calc(100dvh - 150px)',
      onReady: (eventId, _objectKeys, categories = []) => {
        const officialCategories = categories.length > 0 ? categories : chart.getCategories();
        if (!applyPricing(chart, officialCategories)) {
          setStatus(`Mapa pronto — nenhuma categoria recebida para o evento ${eventId}`);
        }
      },
      onSelectionChanged: (seatIds, ticketTypesBySeat, objectKeys, items, pricingSelection) => {
        setStatus(`${seatIds.length} lugar(es) selecionado(s)`);
        console.log('Tipos disponíveis:', ticketTypesBySeat);
        console.log('Seleção de preços:', pricingSelection);
        console.log('Objetos selecionados:', { objectKeys, items });
      },
      onError: (_action, message) => {
        setStatus('Não foi possível carregar o mapa');
        setError(message);
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
        <IonContent fullscreen>
          <main className="booking-shell">
            {error ? (
              <section className="configuration-card">
                <strong>Configuração pendente</strong>
                <p>{error}</p>
                <code>VITE_RESERVAQUI_BASE_URL=https://...</code>
              </section>
            ) : (
              <section className="map-card">
                <div id="seat-map" />
                <IonSpinner name="crescent" className="map-spinner" />
              </section>
            )}
          </main>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
