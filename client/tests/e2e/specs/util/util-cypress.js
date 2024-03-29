import { DateTime } from 'luxon'
import { getFrenchDateFromLuxon, getFrenchDateTimeFromLuxon, getNow } from '../../support/dateUtils'

export const checkEmailValue = (email = Cypress.env('emailCandidat')) => {
  cy.get('.t-result-candidat')
    .contains('Email :')
    .parent()
    .should('contain', email)
}

export const checkPhoneNumberValue = (phoneNumber = Cypress.env('phoneNumberCandidat')) => {
  cy.get('.t-result-candidat')
    .contains('Portable :')
    .parent()
    .should('contain', phoneNumber)
}

export const adminCheckSearchCandidat = (candidatsByDepartments) => {
  cy.visit(Cypress.env('frontAdmin') + 'admin/admin-candidat')
  cy.get('.t-search-candidat [type=text]').type(candidatsByDepartments[0].nomNaissance)
  cy.contains(candidatsByDepartments[0].nomNaissance).click()
  cy.get('h3').should('contain', 'nformations')
  checkEmailValue(candidatsByDepartments[0].email)
}
export const adminLaunchSearchCandidat = (candidatsByDepartments) => {
  cy.adminLogin()
  adminCheckSearchCandidat(candidatsByDepartments)
}

export const adminCheckCandidatHystoryActionsByType = (candidatsByDepartments, typeAction, byThis) => {
  adminLaunchSearchCandidat(candidatsByDepartments)
  cy.get('.t-result-candidat-item').eq(4)
    .parent()
    .should('contain', Cypress.env('centre').toUpperCase())
  cy.get('.t-result-candidat-historique-des-actions')
    .contains('Historique des actions')
  cy.get('.t-history-table')
    .contains(typeAction)
  if (byThis) {
    cy.get('.t-history-table')
      .contains(byThis)
  }
}

export const candidatCantSelectPlace = (magicLink, candidatsByDepartments, nowIn1Week, tInfoCenters75TimeOut, homeDepartement) => {
  cy.visit(magicLink)

  cy.toGoCentre({ tInfoCenters75TimeOut, homeDepartement })
  const classCenter = `.t-centers-${Cypress.env('centre').toLowerCase().replace(/ /g, '-')}`
  cy.get(classCenter).parent()
    .should('contain', 'Plus de place disponible pour le moment')
}

export const candidatBookPlace = (magicLink, candidatsByDepartments, nowIn1Week, hasCheckMail, tInfoCenters75TimeOut, deptSelected) => {
  cy.visit(magicLink)

  cy.toGoSelectPlaces({ tInfoCenters75TimeOut, homeDepartement: candidatsByDepartments[0].homeDepartement, deptSelected })

  cy.log('nowIn1WeekInfo.monthLong:', nowIn1Week.monthLong)
  cy.get(`[href="#tab-${nowIn1Week.monthLong}"]`).click()
  const daySelected = nowIn1Week.toFormat('dd')
  cy.get('body').should('contain', ' ' + daySelected + ' ')
  cy.contains(' ' + daySelected + ' ')
    .parents('.v-list-group').click()
  cy.get('.v-list-group--active')
    .within($date => {
      cy.get('.container')
        .should('contain', '08h30-09h00')
      cy.contains('08h30-09h00').click()
    })
  cy.get('h2').should('contain', 'Confirmation')
  cy.get('h3').should('contain', Cypress.env('centre'))
  cy.get('[type=checkbox]')
    .first()
    .check({ force: true })
  cy.get('[type=checkbox]')
    .last()
    .check({ force: true })

  // Demander un captcha
  cy.get('.pa-1 > :nth-child(1) > :nth-child(1)').should('contain', 'Je ne suis pas un robot')
  cy.get('.pa-1 > :nth-child(1) > :nth-child(1)').click()
  cy.get('button').should('contain', '1')
  cy.getSolutionCaptcha({ email: candidatsByDepartments[0].email })
    .then(imageValueResponse => {
      cy.log('imageValueResponse', imageValueResponse.value)
      // eslint-disable-next-line
      expect(imageValueResponse.success).to.be.true
      cy.get(`.t-${imageValueResponse.value}`).click()
    })
  cy.get('button')
    .should('contain', 'Confirmer')
  cy.get('button')
    .contains('Confirmer')
    .click()
  cy.get('.v-snack--active').should(
    'contain',
    'Votre réservation a bien été prise en compte',
  )
  cy.get('h2').should('contain', 'Ma réservation')
  cy.get('h3').should('contain', Cypress.env('centre'))
  cy.get('p').should('contain', 'à 08:30')
  if (hasCheckMail) {
    cy.getLastMail()
      .getRecipients()
      .should('contain', candidatsByDepartments[0].email)
    cy.getLastMail()
      .getSubject()
      .should(
        'contain',
        '=?UTF-8?Q?Convocation_=C3=A0_l=27examen_pratique_d?= =?UTF-8?Q?u_permis_de_conduire?=',
      )
    cy.getLastMail()
      .its('Content.Body')
      .should('contain', Cypress.env('centre').toUpperCase())
      .and('contain', '8:30')
  }
}

export const candidatCancelPlace = (magicLink, candidatsByDepartments, hasCheckMail) => {
  cy.deleteAllMails()
  cy.visit(magicLink)
  cy.get('body').should('contain', 'Annuler ma réservation')
  cy.contains('Annuler ma réservation').click()
  cy.get('button')
    .should('contain', 'Confirmer')
  cy.get('button')
    .contains('Confirmer')
    .click()
  cy.get('.v-snack--active').should(
    'contain',
    'Votre annulation a bien été prise en compte.',
  )

  cy.get('h2').should('contain', 'Choix du département')
  if (hasCheckMail) {
    cy.getLastMail()
      .getRecipients()
      .should('contain', candidatsByDepartments[0].email)
    cy.getLastMail()
      .getSubject()
      .should(
        'contain',
        '=?UTF-8?Q?Annulation_de_votre_convocation_=C3=A0_l?= =?UTF-8?Q?=27examen?=',
      )
    cy.getLastMail()
      .its('Content.Body')
      .should('contain', Cypress.env('centre').toUpperCase())
      .and('contain', '08:30')
  }
}

export const candidatModifyPlace = (magicLink, candidatsByDepartments, nowIn1Week, hasCheckMail, tInfoCenters75TimeOut) => {
  cy.deleteAllMails()
  const nowIn1WeekInfo = nowIn1Week.toFormat('yyyy-MM-dd')
  cy.visit(magicLink)
  cy.get('.t-candidat-home').click()
  cy.get('h2').should('contain', 'Ma réservation')

  cy.get('body').should('contain', 'Modifier ma réservation')
  cy.contains('Modifier ma réservation').click()

  cy.toGoSelectPlaces({ tInfoCenters75TimeOut })

  cy.get(`[href="#tab-${nowIn1Week.monthLong}"]`).click()

  cy.get('body').should('contain', ' ' + nowIn1WeekInfo.split('-')[2] + ' ')
  cy.contains(' ' + nowIn1WeekInfo.split('-')[2] + ' ')
    .parents('.v-list')
    .within($date => {
      cy.root().click()
      cy.get('.container').should('contain', '09h00-09h30')
      cy.get('.container').contains('09h00-09h30').click()
    })
  cy.get('h2').should('contain', 'Confirmer la modification')
  cy.get('h3').should('contain', Cypress.env('centre'))
  cy.get('[type=checkbox]')
    .first()
    .check({ force: true })
  cy.get('[type=checkbox]')
    .last()
    .check({ force: true })
  cy.get('button')
    .should('contain', 'Confirmer')
  cy.get('button')
    .contains('Confirmer')
    .click()
  cy.get('.v-snack--active').should(
    'contain',
    'Votre réservation a bien été prise en compte',
  )
  cy.get('h2').should('contain', 'Ma réservation')
  cy.get('h3').should('contain', Cypress.env('centre'))
  cy.get('p').should('contain', 'à 09:00')
  if (hasCheckMail) {
    cy.getLastMail()
      .getRecipients()
      .should('contain', candidatsByDepartments[0].email)
    cy.getLastMail()
      .getSubject()
      .should(
        'contain',
        '=?UTF-8?Q?Convocation_=C3=A0_l=27examen_pratique_d?= =?UTF-8?Q?u_permis_de_conduire?=',
      )
    cy.getLastMail()
      .its('Content.Body')
      .should('contain', Cypress.env('centre').toUpperCase())
      .and('contain', '09:00')
    cy.getLastMail({
      subject:
        '=?UTF-8?Q?Annulation_de_votre_convocation_=C3=A0_l?= =?UTF-8?Q?=27examen?=',
    }).should('have.property', 'Content')
  }
}

export const adminCancelBookedPlace = (date) => {
  adminAccessToPlanning(date)
  cy.get('.v-window-item').not('[style="display: none;"]')
    .should('have.length', 1)
    .contains(Cypress.env('inspecteur'))
    .parents('tbody').within(($row) => {
      cy.get('.place-button')
        .contains('face')
        .click()
      cy.contains('Annuler réservation')
        .click()
      cy.contains('Supprimer réservation')
        .click()
    })
  cy.get('.v-snack--active')
    .should('contain', 'La réservation choisie a été annulée.')
}

export const adminBookPlaceForCandidat = (date, candidatsByDepartments) => {
  adminAccessToPlanning(date)
  cy.get('.v-window-item').not('[style="display: none;"]')
    .should('have.length', 1)
    .contains(Cypress.env('inspecteur'))
    .parents('tbody').within(($row) => {
      cy.get('.place-button')
        .contains('check_circle')
        .click()
      cy.contains('Affecter un candidat')
        .click()
      cy.get('.search-input [type=text]')
        .type(candidatsByDepartments[0].email)
      cy.root().parents().contains(candidatsByDepartments[0].nomNaissance)
        .click()
      cy.get('.place-details')
        .should('contain', Cypress.env('centre'))
      cy.contains('Valider')
        .click()
    })
  cy.get('.v-snack--active')
    .should('contain', candidatsByDepartments[0].nomNaissance.toUpperCase())
    .and('contain', 'a bien été affecté à la place')
}

const adminAccessToPlanning = (date) => {
  const dateLocalString = date.startOf('week').toLocaleString({ month: 'short', day: '2-digit', year: 'numeric' })
  const dateFormated = date.toFormat('yyyy-MM-dd')
  const dayNumOfWeek = date.weekday
  const dateFormatedFrench = date.toFormat('dd/MM/yyyy')
  cy.adminLogin()

  cy.get('.home-link')
    .click()
  cy.get('h2.title')
    .should('contain', Cypress.env('centre'))
    .contains(Cypress.env('centre'))
    .parents('.monitor-wrapper').within(($centre) => {
      cy.contains(`${dateLocalString}`)
        .parents('.th-ui-week-column')
        .should('have.class', 'red')
        .parents('tr')
        .find('button').eq(dayNumOfWeek - 1)
        .click()
    })

  cy.url()
    .should('contain', `${dateFormated}`)
  cy.get('.t-date-picker [type=text]').invoke('val')
    .should('contain', `${dateFormatedFrench}`)
  cy.get('.v-tab--active')
    .should('contain', Cypress.env('centre'))
}

export const parseMagicLinkFromMailBody = (mailBody) => {
  const mailBodySplitted = mailBody.replace(/=\r\n/g, '').matchAll(/href=3D"([^"]*candidat[^"]*token[^"]*)"/g)
  const codedLink = [...mailBodySplitted].flat()[1]
  const withoutEq = codedLink
  return withoutEq.replace(/=3D/g, '=')
}

export const parseValidationLinkFromMailBody = (mailBody) => {
  const mailBodySplitted = mailBody.replace(/=\r\n/g, '').matchAll(/href=3D"([^"]*validation[^"]*)"/g)
  const codedLink = [...mailBodySplitted].flat()[1]
  const withoutEq = codedLink
  return withoutEq.replace(/=3D/g, '=')
}
export const adminCheckCandidatPenaltyHystory = (candidatsByDepartments, canBookFrom, reason, byWho, needConnection = true) => {
  const canBookFromTextDate = canBookFrom instanceof DateTime ? getFrenchDateFromLuxon(canBookFrom) : canBookFrom

  if (needConnection) {
    cy.adminLogin()
  }
  adminCheckSearchCandidat(candidatsByDepartments)

  const lineCanBookFrom = cy.get('.t-result-candidat').contains('Réservation possible dès le').parent()
  lineCanBookFrom.should('contain', canBookFromTextDate)

  cy.get('.t-history-penalties').within((tableauHistory) => {
    cy.get('tbody > tr > :nth-child(2)').should('contain', canBookFromTextDate)
    cy.get('tbody > tr > :nth-child(3)').should('contain', reason)// 'Annulation')
    if (byWho) {
      cy.get('tbody > tr > :nth-child(4)').should('contain', byWho) // Cypress.env('adminLogin'))
      const nowTextDateTime = getFrenchDateTimeFromLuxon(getNow())
      cy.get('tbody > tr > :nth-child(5)').should('contain', nowTextDateTime.substring(0, nowTextDateTime.length - 1))
    }
  })
}
