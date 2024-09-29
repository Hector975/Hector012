const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

// Información del evento
const eventDetails = `
📅 *NOVENO NIVEL*
📍 Dirección: Av. Nuevo México 112, San Jerónimo Xonacahuacán, Tecámac, Edomex.
💲 Costo del evento: $80 antes del evento, $100 el día del evento.
🗓 Fecha: 02 de Noviembre, Apertura de puertas a las 15:00 hrs.

🎶 *Participación de:*
- 🎸 SHD Tributo a Héroes del Silencio.
- 🎤 Holkan Mictlan.
- 🎧 Niño Voltio.
- 🥁 The Vshes.
- 🎸 One Last Ride (Tributo a Metallica).
- 🎤 VLV (Tributo a DLD).
- 🪕 El Reboso de la Abuela.
- 🎷 La Roo-ska.
- 🎸 Vulva.
- 🎸 Desierto Seven.

🍴 Además de música en vivo, habrá gastronomía local y artesanías.
`;

// Flujo para la compra de boletos y manejo del cálculo de pago
const flowBoletos = addKeyword(['boletos', 'comprar boletos'])
  .addAnswer(
    ['🎫 ¿Cuántos boletos deseas comprar? (Por favor, ingresa un número del 1 al 10)'],
    { capture: true },
    async (ctx, { flowDynamic }) => {
      const numTickets = parseInt(ctx.body.trim());

      if (isNaN(numTickets) || numTickets < 1 || numTickets > 10) {
        await flowDynamic('❌ Por favor, ingresa un número válido entre 1 y 10.');
        return;
      }

      // Aseguramos que ctx.flow y ctx.flow.state estén inicializados
      ctx.flow = ctx.flow || {};
      ctx.flow.state = ctx.flow.state || {};

      ctx.flow.state.numTickets = numTickets;

      const costoPorBoletoAnticipado = 80;
      const costoPorBoletoDiaEvento = 100;
      const costoTotalAnticipado = numTickets * costoPorBoletoAnticipado;
      const costoTotalDiaEvento = numTickets * costoPorBoletoDiaEvento;

      await flowDynamic([
        `✅ Has seleccionado ${numTickets} boleto(s).`,
        `💲 El costo es de $${costoTotalAnticipado} antes del evento o $${costoTotalDiaEvento} el día del evento.`,
      ]);

      // Enviar los datos de pago de manera inmediata
      await flowDynamic([
        '🔄 Aquí tienes los datos para realizar el pago:',
        '🏦 *Transferencia Bancaria*: Banco XYZ, CLABE 1234567890',
        '💳 También puedes pagar con tarjeta en el siguiente enlace:',
        '🔗 [Pagar con Tarjeta](https://tarjeta.com)',
        '\n📸 Después de realizar el pago, por favor envía cualquier archivo o imagen para continuar.',
      ]);
    }
  )
  .addAnswer(
    ['(.*)'], // Usamos una expresión regular para capturar cualquier mensaje
    { capture: true, media: true, send: false }, // No enviamos el patrón como mensaje
    async (ctx, { flowDynamic }) => {
      console.log('Archivo recibido:', ctx.body, ctx.media); // Verificación en consola

      // Aseguramos que ctx.flow y ctx.flow.state estén inicializados
      ctx.flow = ctx.flow || {};
      ctx.flow.state = ctx.flow.state || {};

      // Continuamos el flujo sin importar el tipo de mensaje o medio recibido
      await flowDynamic('⏳ El pago se está validando y puede tardar hasta 24 horas.');

      // Solicitamos el correo electrónico
      await flowDynamic('📧 Por favor, proporciona tu *correo electrónico* para confirmar tu reservación.');
    }
  )
  .addAnswer(
    ['(.*)'],
    { capture: true, send: false },
    async (ctx, { flowDynamic }) => {
      // Aseguramos que ctx.flow y ctx.flow.state estén inicializados
      ctx.flow = ctx.flow || {};
      ctx.flow.state = ctx.flow.state || {};

      const email = ctx.body.trim();
      ctx.flow.state.email = email;

      // Solicitamos el nombre completo
      await flowDynamic('📝 Ahora, por favor, proporciona tu *nombre completo* para la reservación.');
    }
  )
  .addAnswer(
    ['(.*)'],
    { capture: true, send: false },
    async (ctx, { flowDynamic }) => {
      // Aseguramos que ctx.flow y ctx.flow.state estén inicializados
      ctx.flow = ctx.flow || {};
      ctx.flow.state = ctx.flow.state || {};

      const fullName = ctx.body.trim();
      ctx.flow.state.fullName = fullName;

      // Mostrar el mensaje final según lo solicitado
      await flowDynamic([
        '🎉 Agradecemos mucho tu compra, tu pago se está validando con nuestros asesores, en 24 horas enviaremos los boletos digitales adquiridos al correo indicado.',
        'Si tienes dudas, comentarios o bien, deseas una atención personalizada comunícate al 771-316-9532.',
        '\n👉 Escribe *hola* para regresar al inicio.'
      ]);
    }
  );

// Flujo para obtener la información del evento
const flowEvento = addKeyword(['evento', 'informacion del evento']).addAnswer(
  [
    eventDetails,
    '\n👉 *boletos* para comprar boletos.',
    '\n👉 *hola* para regresar al menú principal.',
  ]
);

// Flujo principal que ofrece las opciones "comprar boletos" e "información del evento"
const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
  .addAnswer(
    '🙌 ¡Hola! Mi nombre es Xolito. Bienvenido a *Noveno Nivel*! 🎉 ¿Cómo podemos ayudarte hoy?'
  )
  .addAnswer(
    [
      '📋 Escribe una de las siguientes opciones para continuar:',
      '👉 *boletos* para comprar boletos 🎫',
      '👉 *evento* para obtener más información del evento *NOVENO NIVEL* 📅',
    ],
    null,
    null,
    [flowBoletos, flowEvento]
  );

// Inicialización del bot con los flujos configurados
const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowPrincipal, flowBoletos, flowEvento]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb(); // Genera el código QR para la vinculación con WhatsApp
};

main();
