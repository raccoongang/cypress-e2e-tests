class teacherDashboardPage {
  activeTabName = '.active-section'

  classDropdown = '#react-course-creation div.selects-holder > div:nth-child(1) > div > div'

  subjectDropdown = '#react-course-creation div.selects-holder > div:nth-child(2) > div > div'

  courseDropdown = '#react-course-creation div.selects-holder > div:nth-child(3) > div > div'

  submitButton = '#react-course-creation .btn-primary-full'

  copyStatusMessage = '.copy-master-status-message'

  inviteButton = '.btn.btn-primary-full'

  setCourseClass(courseClass) {
    cy.get(this.classDropdown).click()
    cy.contains('[role="option"]', courseClass).click()
  }

  setCourseSubject(courseSubject) {
    cy.get(this.subjectDropdown).click()
    cy.contains('[role="option"]', courseSubject).click()
  }

  setCourseDropdown(courseName) {
    cy.get(this.courseDropdown).click()
    cy.contains('[role="option"]', courseName).click()
  }

  getSubmitButton() {
    cy.get(this.submitButton).click()
  }

  checkCopyStatusMessage() {
    cy.get(this.copyStatusMessage).should('have.class', 'is-success')
  }

  getCopiedCourseInviteButton() {
    cy.get(this.inviteButton)
      .invoke('attr', 'href')
      .then(href => {
        expect(href).to.contain(Cypress.env('clonedCourseId'))
      })
    return cy.get(this.inviteButton).should('be.visible')
  }
}

export default teacherDashboardPage
