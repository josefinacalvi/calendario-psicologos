'use server'

import { supabase } from '../../lib/supabaseClient'
import { revalidatePath } from 'next/cache'

export async function createPerfil(formData: FormData) {
  const nombre_completo = formData.get('nombre_completo') as string
  const orientacion_clinica = formData.get('orientacion_clinica') as string
  const especialidades_str = formData.get('especialidades') as string
  const modalidad = formData.get('modalidad') as string
  const zona = formData.get('zona') as string | null
  const disponibilidad_general = formData.get('disponibilidad_general') as string
  const frase_clave = formData.get('frase_clave') as string
  const mini_bio = formData.get('mini_bio') as string
  const estado_membresia_raw = formData.get('estado_membresia')

  const especialidades_array = especialidades_str
    ? especialidades_str.split(',').map(s => s.trim())
    : []
    
  const estado_membresia = estado_membresia_raw === 'on'

  const { data, error } = await supabase
    .from('perfiles_psicologos')
    .insert({
      nombre_completo,
      orientacion_clinica,
      especialidades: especialidades_array,
      modalidad,
      zona: modalidad === 'virtual' ? null : zona,
      disponibilidad_general,
      frase_clave,
      mini_bio,
      estado_membresia,
    })
    .select()

  if (error) {
    console.error('Error al insertar perfil:', error)
    return { success: false, message: 'Fallo la carga del perfil: ' + error.message }
  }

  revalidatePath('/')
  return { success: true, message: `Perfil de ${nombre_completo} creado exitosamente.` }
}
