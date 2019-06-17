// import { synchroAurige, getCandidatsAsCsv } from './business'
import {
  DATETIME_FULL,
  email as emailRegex,
  getFrenchLuxonDateTimeFromJSDate,
  techLogger,
} from '../../util'
import {
  findCandidatByEmail,
  findCandidatById,
  deleteCandidat,
} from '../../models/candidat'
import { findWhitelistedByEmail } from '../../models/whitelisted'
import {
  isAlreadyPresignedUp,
  updateInfoCandidat,
  presignUpCandidat,
  validateEmail,
} from './candidat.business'
import { isMoreThan2HoursAgo } from '../admin/business/synchro-aurige'

const mandatoryFields = [
  'codeNeph',
  'nomNaissance',
  'email',
  'portable',
  'adresse',
]

const trimEveryValue = obj =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = value && (typeof value === 'string' ? value.trim() : value)
    return acc
  }, {})

export async function preSignup (req, res) {
  const candidatData = trimEveryValue(req.body)

  const { codeNeph, nomNaissance, portable, adresse, email } = candidatData

  const isFormFilled = [codeNeph, nomNaissance, email, portable, adresse].every(
    e => !!e
  )

  const isValidEmail = emailRegex.test(email)

  if (!isFormFilled) {
    const fieldsWithErrors = mandatoryFields
      .map(key => (candidatData[key] ? '' : key))
      .filter(e => e)

    if (!isValidEmail && !fieldsWithErrors.includes('email')) {
      fieldsWithErrors.push('email')
    }

    res.status(400).json({
      success: false,
      message: 'Veuillez renseigner tous les champs obligatoires',
      fieldsWithErrors,
    })
    return
  }

  if (!isValidEmail) {
    res.status(400).json({
      success: false,
      message: "L'email renseigné n'est pas valide",
      fieldsWithErrors: ['email'],
    })
    return
  }

  const isCandidatWhitelisted = await findWhitelistedByEmail(email)

  if (!isCandidatWhitelisted) {
    res.status(401).json({
      success: false,
      message: 'Ce site sera ouvert prochainement.',
    })
    return
  }

  const candidatWithSameEmail = await findCandidatByEmail(email)

  if (candidatWithSameEmail) {
    const {
      isValidatedByAurige,
      isValidatedEmail,
      presignedUpAt,
    } = candidatWithSameEmail

    if (isValidatedByAurige) {
      res.status(409).json({
        success: false,
        message:
          'Vous avez déjà un compte sur Candilib avec cette adresse courriel, veuillez cliquer sur le lien "Déjà inscrit"',
      })
      return
    }

    if (isValidatedEmail) {
      res.status(409).json({
        success: false,
        message: `Vous êtes déjà pré-inscrit sur Candilib avec cette adresse courriel, votre compte est en cours de vérification par l'administration.`,
      })
      return
    }

    if (!isValidatedEmail && !isMoreThan2HoursAgo(presignedUpAt)) {
      const deadLineBeforeValidateEmail = getFrenchLuxonDateTimeFromJSDate(
        presignedUpAt
      )
        .plus({ hours: 2 })
        .toLocaleString(DATETIME_FULL)
      res.status(409).json({
        success: false,
        message: `Vous pourrez renouveler votre pré-inscription après le ${deadLineBeforeValidateEmail}.`,
      })
      return
    }

    await deleteCandidat(candidatWithSameEmail, 'EMAIL_NOT_VERIFIED_EXPIRED')
  }

  const result = await isAlreadyPresignedUp(candidatData)

  if (!result.success) {
    res.status(409).json(result)
    return
  }

  if (!result.candidat) {
    try {
      const response = await presignUpCandidat(candidatData)
      res.status(200).json(response)
    } catch (error) {
      techLogger.error(error)
      res.status(500).json({ success: false, ...error })
    }
    return
  }

  const updateResult = await updateInfoCandidat(result.candidat, candidatData)

  if (updateResult.success) {
    res.status(200).json(updateResult)
    return
  }

  res.status(409).json(updateResult)
}

export async function getMe (req, res) {
  try {
    const options = {
      _id: 0,
      nomNaissance: 1,
      prenom: 1,
      codeNeph: 1,
      email: 1,
      portable: 1,
      adresse: 1,
      departement: 1,
    }

    const candidat = await findCandidatById(req.userId, options)

    res.json({
      candidat,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: JSON.stringify(error),
    })
  }
}

export async function emailValidation (req, res) {
  const { email, hash } = req.body
  try {
    const candidat = await findCandidatByEmail(email)

    if (!candidat) {
      throw new Error('Votre adresse courriel est inconnue.')
    }

    if (candidat.isValidatedEmail) {
      res.status(200).json({
        success: true,
        message: 'Votre adresse courriel est déjà validée.',
      })
      return
    }

    if (candidat.emailValidationHash !== hash) {
      throw new Error('Le hash ne correspond pas.')
    }

    const emailValidationResult = await validateEmail(email, hash)

    res.status(200).json(emailValidationResult)
  } catch (error) {
    res.status(422).json({
      success: false,
      message:
        'Impossible de valider votre adresse courriel : ' + error.message,
    })
  }
}
