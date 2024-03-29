/*
Add user in users list
Add user with an exiting email
Cancel Archive user
Archive user
*/

const createRepartiteur = (repartiteurEmail, mustSuccess = true, notWithDepartement = false) => {
  cy.get('.t-input-email input')
    .type(repartiteurEmail, { force: true })
  cy.get('.t-select-status')
    .click()
  cy.get('.menuable__content__active').contains(Cypress.env('repartiteur'))
    .click()
  if (!notWithDepartement) {
    cy.get('.t-select-departements')
      .click()
    cy.get('.menuable__content__active').contains('75')
      .click()
  }
  cy.get('.t-create-btn')
    .click()
  cy.checkAndCloseSnackBar(mustSuccess ? 'L\'utilisateur a bien été créé' : 'Impossible de créer l\'utilisateur : l\'email existe déjà')
}

const createTechAdmin = (techAdminEmail, mustSuccess = true) => {
  cy.get('.t-input-tech-email input')
    .type(techAdminEmail, { force: true })
  cy.get('.t-create-tech-btn')
    .click()
  // cy.checkAndCloseSnackBar(mustSuccess ? 'L\'utilisateur a bien été créé' : 'Impossible de créer l\'utilisateur : l\'email existe déjà')
}

describe('Create and see users', () => {
  const repartiteurEmail1 = 'repartiteur1@example.com'
  const repartiteurEmail2 = 'repartiteur2@example.com'
  const repartiteurEmail3 = 'repartiteur3@example.com'
  const repartiteurEmail4 = 'repartiteur4@example.com'
  const repartiteurEmail5 = 'repartiteur5@example.com'
  const repartiteurEmail6 = 'repartiteur6@example.com'
  const technicalAdminEmail = 'tech1@example.com'

  before(() => {
    cy.deleteAllMails()
    cy.deleteUser({ email: repartiteurEmail1 })
    cy.deleteUser({ email: repartiteurEmail2 })
    cy.deleteUser({ email: repartiteurEmail3 })
    cy.deleteUser({ email: repartiteurEmail4 })
    cy.deleteUser({ email: repartiteurEmail5 })
    cy.deleteUser({ email: repartiteurEmail6 })
  })

  beforeEach(() => {
    cy.adminLogin()
  })

  afterEach(() => {
    cy.adminDisconnection()
  })

  it('Should create a new user', () => {
    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')

    createRepartiteur(repartiteurEmail1)

    cy.get('.t-list-users')
      .should('contain', repartiteurEmail1)
  })

  it('Should not create a user with existing email', () => {
    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')

    createRepartiteur(repartiteurEmail2)

    createRepartiteur(repartiteurEmail2, false)
  })

  it('Should not archive user if cancel archive users', () => {
    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')

    createRepartiteur(repartiteurEmail3)

    cy.get('.t-list-users')
      .find('th span')
      .first()
      .click({ force: true })
      .click({ force: true })
    cy.get('.t-list-users')
      .should('contain', repartiteurEmail3)

    cy.get('.t-list-users')
      .contains(repartiteurEmail3)
      .parents('tr')
      .find('.t-btn-delete')
      .click()
    cy.get('.t-btn-cancel-delete')
      .click()

    cy.get('.t-list-users')
      .should('contain', repartiteurEmail3)
  })

  it('Should archive existing user', () => {
    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')

    createRepartiteur(repartiteurEmail4)

    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')
    cy.get('.t-list-users')
      .find('th span')
      .first()
      .click({ force: true })
      .click({ force: true })
    cy.get('.t-list-users')
      .should('contain', repartiteurEmail4)

    cy.get('.t-list-users')
      .contains(repartiteurEmail4)
      .parents('tr')
      .find('.t-btn-delete')
      .click()
    cy.get('.t-btn-delete-confirm')
      .click()

    cy.get('.v-snack--active')
      .should('contain', 'L\'utilisateur a bien été archivé')

    cy.get('.t-list-users')
      .should('not.contain', repartiteurEmail4)

    cy.get('.t-list-archive-users')
      .should('contain', repartiteurEmail4)

    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')
    cy.get('.t-list-archive-users')
      .find('th span')
      .first()
      .click({ force: true })
      .click({ force: true })
    cy.get('.t-list-archive-users')
      .should('contain', repartiteurEmail4)
    cy.get('.t-archive-user-icon').click()
    cy.get('.t-archive-user-submit').click()
    cy.get('.t-list-users')
      .should('contain', repartiteurEmail4)

    // cy.visit(Cypress.env('frontAdmin') + 'admin/agents')
    cy.get('.t-list-users')
      .find('th span')
      .first()
      .click({ force: true })
      .click({ force: true })
    cy.get('.t-list-users')
      .should('contain', repartiteurEmail4)

    cy.get('.t-list-users')
      .contains(repartiteurEmail4)
      .parents('tr')
      .find('.t-btn-delete')
      .click()
    cy.get('.t-btn-delete-confirm')
      .click()

    cy.get('.v-snack--active')
      .should('contain', 'L\'utilisateur a bien été archivé')

    cy.get('.t-list-users')
      .should('not.contain', repartiteurEmail4)
  })

  it('Should update status and/or departements user', () => {
    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')

    createRepartiteur(repartiteurEmail5, true, true)

    cy.get('.t-list-users')
      .find('th span')
      .first()
      .click({ force: true })
      .click({ force: true })
    cy.get('.t-list-users')
      .should('contain', repartiteurEmail5)
    cy.get('.t-list-users')
      .contains(repartiteurEmail5)
      .parents('tr')
      .should('contain', '75')
    cy.get('.t-list-users')
      .contains(repartiteurEmail5)
      .parents('tr')
      .find('.t-btn-update')
      .click()
    cy.get('.t-select-update-status')
      .click()
    cy.get('.menuable__content__active .v-list-item__title')
      .should('contain', Cypress.env('delegue'))
    cy.get('.menuable__content__active .v-list-item__title')
      .contains(Cypress.env('delegue'))
      .click()
    cy.get('.t-select-update-departements')
      .click()
    cy.get('.menuable__content__active .v-list-item__title')
      .should('contain', '93')
    cy.get('.menuable__content__active .v-list-item__title')
      .contains('93')
      .click({ force: true })
    cy.get('.t-title-update')
      .click()
    cy.get('.t-btn-update-confirm')
      .click()

    cy.get('.t-list-users')
      .should('contain', repartiteurEmail5)
    cy.get('.t-list-users')
      .contains(repartiteurEmail5)
      .parents('tr')
      .should('contain', '75')
  })

  it('Should not update status and/or departements of user', () => {
    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')

    createRepartiteur(repartiteurEmail6)

    cy.get('.t-list-users')
      .find('th span')
      .first()
      .click({ force: true })
      .click({ force: true })
    cy.get('.t-list-users')
      .should('contain', repartiteurEmail6)
      .contains(repartiteurEmail6)
      .parents('tr')
      .find('.t-btn-update')
      .click()
    cy.get('.t-btn-cancel-update')
      .click()

    cy.get('.t-list-users')
      .should('contain', repartiteurEmail6)
  })

  it('Should create a new technical user', () => {
    cy.visit(Cypress.env('frontAdmin') + 'admin/agents')

    createTechAdmin(technicalAdminEmail)

    cy.get('.t-list-technical-users')
      .should('contain', technicalAdminEmail)
  })
})
