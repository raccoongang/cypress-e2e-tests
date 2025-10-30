class CourseHomePage {
  courseTitle = '.course-card-title'

  courseOutline = '#courseHome-outline'

  expandAllButton = '#expand-button-row button'

  expandCollapseSection = '#courseHome-outline .collapsible-trigger'

  getCourseTitle(courseName) {
    return cy.get(this.courseTitle).contains(courseName)
  }

  getCourseOutline() {
    return cy.get(this.courseOutline)
  }

  checkSections() {
    cy.get(this.courseOutline)
      .should('have.attr', 'sectionids')
      .and('not.be.empty')
  }

  checkExpandAll() {
    cy.get(this.expandAllButton).contains('Розгорнути всі').click()
    cy.get(this.expandCollapseSection)
      .each($el => {
        cy.wrap($el).should('have.attr', 'aria-expanded', 'true')
      })
  }

  checkCollapseAll() {
    cy.get(this.expandAllButton).contains('Згорнути всі').click()
    cy.get(this.expandCollapseSection)
      .each($el => {
        cy.wrap($el).should('have.attr', 'aria-expanded', 'false')
      })
  }
}

export default CourseHomePage
