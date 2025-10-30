class UnitPage {
  courseCardTitle = '.card-item-title'

  emptyCourseContent = '[data-testid="empty-placeholder"]'

  newSection = '[data-testid="new-section-button"]'

  sectionCard = '[data-testid="section-card"]'

  newSubsection = '[data-testid="section-card__subsections"]'

  subsectionCard = '[data-testid="subsection-card"]'

  newUnit = '[data-testid="subsection-card__units"]'

  newComponent = '.new-component-type'

  sectionActionsDropdown = '#section-card-header__menu'

  unitActionsDropdown = '#unit-card-header__menu'

  publishSectionToggle = '[data-testid="section-card-header__menu-publish-button"]'

  deleteUnitToggle = '[data-testid="unit-card-header__menu-delete-button"]'

  deleteSectionToggle = '[data-testid="section-card-header__menu-delete-button"]'

  configureUnitToggle = '[data-testid="unit-card-header__menu-configure-button"]'

  unitVisibilityCheckbox = '[data-testid="unit-visibility-checkbox"]'

  modalContent = '.pgn__modal-body-content'

  modalFooter = '.pgn__modal-footer'

  viewLiveButton = 'button.btn-outline-primary'

  modalTitle = '.pgn__modal-title'

  hideBadge = '[data-testid="unit-card-header"]'

  getCourseCard(courseName) {
    return cy.get(this.courseCardTitle).contains(courseName)
  }

  addSection() {
    cy.intercept('POST', '/xblock/').as('newSection')
    cy.get(this.emptyCourseContent).contains('button', 'Новий розділ').click()
    cy.get(this.emptyCourseContent).should('not.exist')
    cy.get(this.sectionCard).should('be.visible')
    cy.get(this.newSubsection).should('be.visible')
    return cy.wait('@newSection').then((interception) => {
      const responseBody = interception.response.body
      this.sectionLocator = responseBody.locator
      cy.log('Section Locator:', this.sectionLocator)
      cy.wrap(responseBody.locator).as('sectionLocator')
    })
  }

  addSubsection() {
    cy.intercept('POST', '/xblock/').as('newSubsection')
    cy.get(this.newSubsection).contains('button', 'Новий підрозділ').click()
    cy.get(this.subsectionCard).should('be.visible')
    return cy.wait('@newSubsection').then((interception) => {
      const responseBody = interception.response.body
      this.subsectionLocator = responseBody.locator
      cy.log('Subsection Locator:', this.subsectionLocator)
      cy.wrap(responseBody.locator).as('subsectionLocator')
    })
  }

  addUnit() {
    cy.intercept('POST', '/xblock/').as('newUnit')
    // cy.get(this.subsectionCard).click()
    cy.get(this.newUnit).contains('button', 'Новий блок').click()
    return cy.wait('@newUnit').then((interception) => {
      const responseBody = interception.response.body
      this.unitLocator = responseBody.locator
      cy.log('Unit Locator:', this.unitLocator)
      cy.wrap(responseBody.locator).as('unitLocator')
    })
  }

  openUnit(courseLocator) {
    return cy.fixture('new_course_data').then((data) => {
      const { unitLocator } = data
      const { subsectionLocator } = data
      const url = `${Cypress.env('BASE_MFE_URL')}/authoring/course/${courseLocator}/container/${unitLocator}/${subsectionLocator}`
      return cy.visit(url)
    })
  }

  expandSubection() {
    cy.get(this.subsectionCard).click()
  }

  addTextBlock(text) {
    cy.get(this.newComponent).contains('button', 'Текст').click()
    cy.get(this.modalContent).should('be.visible')
      .contains('label', 'Текст').click()
    cy.get(this.modalFooter).contains('button.btn-primary', 'Вибрати').click()
    cy.get('div[role="dialog"][aria-label="Editor Dialog"]').should('be.visible')
    cy.get('iframe.tox-edit-area__iframe').then($iframe => {
      const body = $iframe.contents().find('body')
      cy.wrap(body).find('p').type(text, { force: true })
    })
    cy.get('button[aria-label="Save changes and return to learning context"]').click()
  }

  getViewLiveButton() {
    return cy.contains(this.viewLiveButton, 'View live version')
  }

  getPreviewButton() {
    return cy.contains(this.viewLiveButton, 'Preview')
  }

  checkIframeContent(text) {
    cy.get('iframe#unit-iframe')
      .should('exist')
      .invoke('attr', 'src')
      .then((src) => {
        cy.log('Iframe src:', src)
        cy.visit(src)
        cy.get('p').should('contain.text', text)
      })
  }

  checkEmptyUnitBlock() {
    cy.get(this.newComponent).contains('button', 'Текст')
    cy.get(this.newComponent).contains('button', 'Відео')
    cy.get(this.newComponent).contains('button', 'Завдання')
    cy.get(this.newComponent).contains('button', 'задача Банк')
    cy.get(this.newComponent).contains('button', 'Вміст бібліотеки')
    cy.get(this.newComponent).contains('button', 'Спадщина бібліотека')
    cy.get(this.newComponent).contains('button', 'Відповідь у вільній формі')
    cy.get(this.newComponent).contains('button', 'Перетягнути і Скинути')
    cy.get(this.newComponent).contains('button', 'Додатково')
  }

  publishSection() {
    cy.intercept('/xblock/*').as('publishSection')
    cy.get(this.sectionActionsDropdown).click()

    cy.get(this.publishSectionToggle)
      .should('be.visible')
      .and('contain', 'Опублікувати')
      .and('have.attr', 'role', 'button')

    cy.contains('Опублікувати').click()
    cy.get('.publish-modal[role="dialog"]').should('be.visible')
    cy.contains(this.modalTitle, 'Опублікувати Section').should('be.visible')
    cy.get('button[data-testid="publish-confirm-button"]').should('be.visible').click()
    return cy.wait('@publishSection')
  }

  deleteSection() {
    cy.intercept('DELETE', '/xblock/*').as('deleteSection')
    cy.get(this.sectionActionsDropdown).click()

    cy.get(this.deleteSectionToggle)
      .should('be.visible')
      .and('contain', 'Видалити')
      .and('have.attr', 'role', 'button')

    cy.contains('Видалити').click()
    cy.contains(this.modalTitle, 'Видаляти цю section?').should('be.visible')
    cy.get('div[role="dialog"][aria-label="Видаляти цю section?"]')
      .find('button')
      .contains('Видалити')
      .click()
    return cy.wait('@deleteSection')
  }

  hideFromLearners() {
    cy.get(this.unitActionsDropdown).click()

    cy.get(this.configureUnitToggle)
      .should('be.visible')
      .and('contain', 'Налаштувати')
      .and('have.attr', 'role', 'button')

    cy.contains('Налаштувати').click()
    cy.get('[data-testid="configure-modal"]').should('be.visible')
    cy.contains(this.modalTitle, 'налаштування Unit').should('be.visible')
    cy.get(this.unitVisibilityCheckbox).check().should('be.checked')
    cy.get('[data-testid="configure-save-button"]').click()
  }

  checkHideBadge() {
    cy.get(this.hideBadge).contains('Тільки для персоналу')
  }

  deleteUnit() {
    cy.get(this.unitActionsDropdown).click()

    cy.get(this.deleteUnitToggle)
      .should('be.visible')
      .and('contain', 'Видалити')
      .and('have.attr', 'role', 'button')

    cy.contains('Видалити').click()
    cy.contains(this.modalTitle, 'Видаляти цю unit').should('be.visible')

    cy.get('div[role="dialog"][aria-label="Видаляти цю unit?"]')
      .find('button')
      .contains('Видалити')
      .click()
  }
}

export default UnitPage
