import {
  SUBJECT_CONVOCATION,
  SUBJECT_CANCEL_RESA,
} from '../send-message-constants'
import { getConvocationBody } from '../build-mail-convocation'
import { getCancellationBody } from '../build-mail-cancellation'
import { getScheduleInspecteurBody } from '../send-mail-schedule-inspecteur'

export async function expectMailConvocation (candidat, place) {
  const bodyMail = require('../send-mail').getMail()
  expect(bodyMail).toBeDefined()
  expect(bodyMail).toHaveProperty('to', candidat.email)
  expect(bodyMail).toHaveProperty('subject', SUBJECT_CONVOCATION)
  place.candidat = candidat
  expect(bodyMail).toHaveProperty('html', await getConvocationBody(place))
}

export async function expectMailCancelBooking (candidat, place) {
  const bodyMail = require('../send-mail').getMail()
  expect(bodyMail).toBeDefined()
  expect(bodyMail).toHaveProperty('to', candidat.email)
  expect(bodyMail).toHaveProperty('subject', SUBJECT_CANCEL_RESA)

  expect(bodyMail).toHaveProperty('html', await getCancellationBody(place, candidat))
}

export async function expectMailBordereaux (subjectParams) {
  const {
    inspecteurName,
    inspecteurMatricule,
    dateToString,
    centreNom,
    departement,
    emailInspecteur,
    places,
  } = subjectParams
  const bodyMail = require('../send-mail').getMail()
  expect(bodyMail).toBeDefined()
  expect(bodyMail).toHaveProperty('to', [emailInspecteur])
  expect(bodyMail).toHaveProperty(
    'subject',
    `Bordereau de l'inspecteur ${inspecteurName}/${inspecteurMatricule} pour le ${dateToString} au centre de ${centreNom} du département ${departement}`,
  )
  expect(bodyMail).toHaveProperty(
    'html',
    await getScheduleInspecteurBody(
      inspecteurName,
      inspecteurMatricule,
      dateToString,
      centreNom,
      departement,
      places,
    ),
  )
}
