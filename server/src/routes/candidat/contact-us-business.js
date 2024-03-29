import {
  sendMailContactUsForAdmin,
  sendMailContactUsForCandidat,
} from '../business/send-mail-contact-us'
import { findCandidatById } from '../../models/candidat'
import { appLogger } from '../../util'
import {
  PARAMS_MISSING,
  DEPARTEMENT_EMAIL_MISSING,
  CONTACT_US_SEND_TO_ADMIN_FAILED,
  CONTACT_US_SEND_TO_CANDIDAT_FAILED,
  CONTACT_US_CONFIRM_SEND,
} from './message.constants'
import { findDepartementById } from '../../models/departement'

export const sendMessageByContactUs = async (
  loggerInfo,
  candidatId,
  candidat,
  hasSignUp,
  subject,
  message,
  isModifyHomeDepartement,
) => {
  let candidatData = candidat
  candidatData.homeDepartement = candidat.departement
  let hasSignUpData = hasSignUp

  if (candidatId) {
    const candidatFound = await findCandidatById(candidatId, {
      codeNeph: 1,
      nomNaissance: 1,
      prenom: 1,
      portable: 1,
      email: 1,
      homeDepartement: 1,
      departement: 1,
    })
    if (!candidatFound) {
      appLogger.warn({ ...loggerInfo, description: 'Candidat non trouvé' })
    } else {
      candidatData = candidatFound
      hasSignUpData = true
    }
  }

  if (
    !candidatData ||
    (!candidatData.codeNeph ||
      !candidatData.nomNaissance ||
      !candidatData.email ||
      !candidatData.departement)
  ) {
    const description = PARAMS_MISSING
    const error = new Error(description)
    error.status = 400
    throw error
  }

  let selectDepartement = candidatData.departement
  let subjectEmail = subject
  let messageEmail = message
  if (hasSignUpData && isModifyHomeDepartement) {
    selectDepartement = candidat.departement
    subjectEmail = 'Demande de modification de département de résidence'
    messageEmail =
      `Le candidat souhaite changer son département de résidence actuel qui est le ${candidatData.homeDepartement}, pour être affecté au département de résidence ${selectDepartement}.`
  }

  const infoDepartement = await findDepartementById(selectDepartement)

  if (!infoDepartement || !infoDepartement.email) {
    throw new Error(DEPARTEMENT_EMAIL_MISSING)
  }

  try {
    await sendMailContactUsForAdmin(
      infoDepartement.email,
      candidatData,
      hasSignUpData,
      subjectEmail,
      messageEmail,
    )
  } catch (error) {
    throw new Error(CONTACT_US_SEND_TO_ADMIN_FAILED)
  }

  try {
    await sendMailContactUsForCandidat(candidatData)
  } catch (error) {
    throw new Error(CONTACT_US_SEND_TO_CANDIDAT_FAILED)
  }

  return CONTACT_US_CONFIRM_SEND(candidatData.email)
}
