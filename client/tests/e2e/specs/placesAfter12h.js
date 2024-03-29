import { now } from '../support/dateUtils'
import { parseMagicLinkFromMailBody } from './util/util-cypress'

let dateAt3Months
let dateAt2Months
let dateAt1Months
let dateAt2Weeks
describe('Display new place after 12h', () => {
  if (Cypress.env('VUE_APP_CLIENT_BUILD_INFO') !== 'END') {
    let magicLink
    before(() => {
      cy.deleteAllPlaces()

      cy.deleteAllMails()
      cy.adminLogin()

      dateAt2Months = now.plus({ months: 2 }).startOf('week')
      dateAt1Months = now.plus({ months: 1 }).startOf('week')
      dateAt2Weeks = now.plus({ weeks: 2 }).startOf('week')
      dateAt3Months = now.plus({ months: 3 }).startOf('week')
      cy.addPlanning([dateAt2Weeks, dateAt1Months, dateAt3Months, dateAt2Months])
      cy.adminDisconnection()
      cy.updatePlaces({}, {
        createdAt: now.set({ hour: 9 }).minus({ days: 1 }).toUTC(),
        visibleAt: now.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).minus({ days: 1 }).toUTC(),
      })
      cy.updatePlaces({ date: { $gte: dateAt1Months.toUTC() } }, {
        createdAt: now.set({ hour: 12 }).minus({ days: 1 }).toUTC(),
        visibleAt: now.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).plus({ days: 1 }).toUTC(),
      })
      cy.updatePlaces({ date: { $gte: dateAt2Months.toUTC() } }, {
        createdAt: now.set({ hour: 9 }).toUTC(),
        visibleAt: now.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toUTC(),
      })
      cy.updatePlaces({ date: { $gte: dateAt3Months.toUTC() } }, {
        createdAt: now.set({ hour: 12 }).toUTC(),
        visibleAt: now.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).plus({ days: 1 }).toUTC(),
      })

      cy.candidatConnection(Cypress.env('emailCandidatFront'))
      cy.getLastMail().its('Content.Body').then((mailBody) => {
        magicLink = parseMagicLinkFromMailBody(mailBody)
      })

      cy.updateCandidat({ email: Cypress.env('emailCandidatFront') }, { canBookFrom: '' })
    })

    it('Should have places for 93', () => {
      cy.visit(magicLink)
      cy.wait(100)

      cy.toGoSelectPlaces()

      const dates = [dateAt2Weeks]
      const datesNoDisplay = [dateAt3Months]
      if (now.hour < 12) {
        datesNoDisplay.concat([dateAt2Months, dateAt1Months])
      } else {
        dates.concat([dateAt2Months, dateAt1Months])
      }

      dates.forEach((datePlace) => {
        cy.get(`[href="#tab-${datePlace.monthLong}"]`).click()
        const daySelected = datePlace.toFormat('dd')
        cy.get('body').should('contain', ' ' + daySelected + ' ')
      })
      datesNoDisplay.forEach((datePlace) => {
        cy.get(`[href="#tab-${datePlace.monthLong}"]`).click()
        const daySelected = datePlace.toFormat('dd')
        cy.get('body').should('not.contain', ' ' + daySelected + ' ')
      })
    })
  } else {
    it('skip for message END', () => { cy.log('skip for message END') })
  }
})
