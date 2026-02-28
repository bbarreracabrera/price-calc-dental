import { createClient } from '@supabase/supabase-js';

// Conectamos con Supabase (Vercel leerá estas variables de entorno)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
// IMPORTANTE: Usamos la Service Key (llave maestra) para poder editar usuarios desde el servidor

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Mercado Pago siempre envía alertas por el método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const alerta = req.body;

    // Verificamos si la alerta es sobre una suscripción (preapproval)
    if (alerta.type === 'subscription_preapproval') {
      const suscripcionId = alerta.data.id;
      
      // 1. Le preguntamos a Mercado Pago el estado real de esta suscripción
      const respuestaMP = await fetch(`https://api.mercadopago.com/preapproval/${suscripcionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });
      const datosSuscripcion = await respuestaMP.json();

      // 2. Si el estado es "cancelled" o "paused" (dejó de pagar)
      if (datosSuscripcion.status === 'cancelled' || datosSuscripcion.status === 'paused') {
        const emailDelCliente = datosSuscripcion.payer_email;

        // 3. Le decimos a Supabase que bloquee/desactive a este usuario
        // Asumiendo que tienes una tabla 'perfiles' o 'clinicas' con el email
        const { error } = await supabase
          .from('perfiles') // Cambia 'perfiles' por el nombre real de tu tabla si es distinto
          .update({ estado_suscripcion: 'inactiva' })
          .eq('email', emailDelCliente);

        if (error) throw error;
        
        console.log(`Suscripción cancelada procesada para: ${emailDelCliente}`);
      }
    }

    // Siempre hay que decirle "OK" a Mercado Pago rápido para que no siga insistiendo
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Error en el Webhook:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}