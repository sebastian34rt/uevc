import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import SEO from './SEO';

export default function PrivacyPolicy() {
  return (
    <main className="flex-1 w-full pt-8 pb-24 px-4 sm:px-6 lg:px-10 max-w-3xl mx-auto">
      <SEO 
        title="Política de Privacidad"
        description="Conoce nuestras políticas y medidas para la protección y tratamiento confidencial de los datos personales de nuestra comunidad educativa."
        path="/privacidad"
      />
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4 mb-8 text-primario">
          <Shield className="w-10 h-10" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1]">Política de Privacidad</h1>
        </div>

        <div className="prose prose-neutral max-w-none text-texto/80 space-y-6">
          <p className="lead text-lg font-medium">
            La Unidad Educativa Particular "Virgen del Cisne" se compromete a proteger la privacidad y los datos personales de nuestra comunidad educativa (estudiantes, padres de familia, docentes y personal administrativo).
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">1. Recopilación de Información</h2>
          <p>
            Recopilamos información personal necesaria para el proceso educativo y administrativo, la cual puede incluir: datos de identificación, información académica, historial médico básico (para emergencias), e información de contacto de los tutores legales.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">2. Uso de la Información</h2>
          <p>
            Los datos recopilados se utilizan exclusivamente para:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Gestión académica y matriculación.</li>
            <li>Comunicación con padres de familia y representantes.</li>
            <li>Cumplimiento de requisitos del Ministerio de Educación de Ecuador.</li>
            <li>Emisión de facturas y gestión de cobros.</li>
          </ul>

          <h2 className="text-xl font-bold text-texto mt-10">3. Protección de Datos</h2>
          <p>
            Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger la información personal contra pérdida, robo, acceso, uso o modificación no autorizada, en cumplimiento con la Ley Orgánica de Protección de Datos Personales del Ecuador.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">4. Compartición de Datos</h2>
          <p>
            No vendemos ni alquilamos su información personal a terceros. Solo compartiremos información con entidades gubernamentales (como el Ministerio de Educación) cuando la ley lo exija o mediante plataformas educativas oficiales (como Idukay) que mantienen estrictos acuerdos de confidencialidad.
          </p>

          <h2 className="text-xl font-bold text-texto mt-10">5. Derechos del Titular</h2>
          <p>
            Usted tiene derecho a acceder, rectificar, actualizar o solicitar la eliminación de sus datos personales o los de su representado, acercándose a la secretaría de la institución.
          </p>

          <div className="mt-12 p-6 bg-primario/5 rounded-2xl border border-primario/10">
            <h3 className="font-bold text-texto mb-2">Contacto de Privacidad</h3>
            <p className="text-sm">Si tiene preguntas sobre nuestra Política de Privacidad, contáctenos al: <a href="tel:0981179375" className="text-primario font-bold">0981179375</a></p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
