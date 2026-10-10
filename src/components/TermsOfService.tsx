import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import SEO from './SEO';

export default function TermsOfService() {
  return (
    <main className="flex-1 w-full pt-8 pb-24 px-4 sm:px-6 lg:px-10 max-w-3xl mx-auto">
      <SEO 
        title="Términos de Servicio"
        description="Términos y condiciones de uso del portal web, servicios digitales y procesos en línea de la institución."
        path="/terminos"
      />
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4 mb-8 text-primario">
          <FileText className="w-10 h-10" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1]">Términos de Servicio</h1>
        </div>

        <div className="prose prose-neutral max-w-none text-texto/80 space-y-6">
          <p className="lead text-lg font-medium">
            Al utilizar el sitio web y los servicios de la Unidad Educativa Particular "Virgen del Cisne", usted acepta los siguientes términos y condiciones.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">1. Uso del Sitio Web</h2>
          <p>
            Este sitio web tiene fines informativos y de comunicación para la comunidad educativa. El usuario se compromete a hacer un uso adecuado de los contenidos y servicios, evitando cualquier acción que pueda dañar, inutilizar o sobrecargar el portal.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">2. Propiedad Intelectual</h2>
          <p>
            Todo el contenido de este sitio web, incluyendo textos, imágenes, logotipos, diseño y código fuente, es propiedad de la Unidad Educativa "Virgen del Cisne" o cuenta con la debida autorización para su uso. Queda prohibida su reproducción, distribución o modificación sin consentimiento previo por escrito.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">3. Admisiones y Formularios</h2>
          <p>
            La información proporcionada a través de los formularios de admisión y contacto debe ser veraz y exacta. El envío de una solicitud de admisión no garantiza un cupo en la institución, el cual está sujeto al proceso de evaluación y disponibilidad.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">4. Plataformas Externas</h2>
          <p>
            Nuestra web proporciona enlaces a plataformas de terceros (como Idukay o portales de facturación). La institución no se responsabiliza por el funcionamiento, disponibilidad o políticas de privacidad de estos sitios externos.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">5. Modificaciones</h2>
          <p>
            La Unidad Educativa "Virgen del Cisne" se reserva el derecho de modificar, actualizar o retirar contenidos y servicios del sitio web, así como de actualizar estos Términos de Servicio en cualquier momento.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
