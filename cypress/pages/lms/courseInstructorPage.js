class courseInstructorPage {
  studentIds = 'textarea[name="student-ids"]'

  studentEnrollButton = 'input.enrollment-button[data-action="enroll"]'

  studentUnenrollButton = 'input.enrollment-button[data-action="unenroll"]'

  setStudentId(value) {
    return cy.get(this.studentIds)
      .should('be.visible')
      .type(value)
  }

  clickStudentEnrollButton() {
    cy.get(this.studentEnrollButton).should('be.visible').first().click()
  }

  clickStudentUnenrollButton() {
    cy.get(this.studentUnenrollButton).should('be.visible').first().click()
  }
}

export default courseInstructorPage
