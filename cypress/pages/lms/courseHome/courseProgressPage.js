import { getCsrfToken, getRequestHeaders } from '../../../support/apiHelpers'

class CourseProgressPage {
  nav_links = 'a.nav-link'

  courseProgressSection = 'section.rounded'

  completionDonutChart = '.donut'

  completionPercentage = '.donut-chart-number'

  gradeBar = 'svg.grade-bar'

  currentGrade = '#non-passing-grade-tooltip'

  passingGrade = '#minimum-grade-tooltip'

  gradeSummaryTable = 'table.pgn__data-table'

  certificateStatusSection = '#downloadable_certificate_status'

  certificateButton = '#downloadable_certificate_status a.btn'

  navigateToProgressTab() {
    cy.contains(this.nav_links, 'Progress').click()
    cy.url().should('include', '/progress')
  }

  /**
   * Navigate to Course Home via Dashboard "Resume/Begin/View Course" button.
   * User must already be enrolled.
   */
  goToCourseHomeFromDashboard(baseMFEURL, courseName, courseId) {
    cy.visit(`${baseMFEURL}/learner-dashboard/`)
    cy.contains('[data-testid="CourseCardTitle"]', courseName)
      .parents('[data-testid="CourseCard"]')
      .find('[data-test-id="CourseCardActions"] a.btn')
      .should('be.visible')
      .click()
    cy.url().should('include', `/learning/course/${courseId}`)
  }

  // ─── Progress page section checks ───────────────────────────────────────
  checkCourseProgressHeader() {
    cy.contains('h1', 'Your progress').should('be.visible')
  }

  checkCourseCompletionSection() {
    cy.get(this.courseProgressSection)
      .contains('h2', 'Course completion')
      .should('be.visible')
  }

  checkCourseCompletionChart() {
    cy.contains('section', 'Course completion')
      .within(() => {
        cy.get(this.completionDonutChart).should('be.visible')
        cy.get(this.completionPercentage).should('be.visible')
      })
  }

  checkGradesSection() {
    cy.get(this.courseProgressSection)
      .contains('h2', 'Grades')
      .should('be.visible')
  }

  checkGradesBar() {
    cy.get(this.gradeBar).should('be.visible').within(() => {
      cy.contains('text', 'Your current grade').should('be.visible')
      cy.contains('text', 'Passing grade').should('be.visible')
    })
    cy.get(this.currentGrade).should('be.visible')
    cy.get(this.passingGrade).should('be.visible')
  }

  checkGradeSummary() {
    cy.contains('h3', 'Grade summary').should('be.visible')

    cy.get(this.gradeSummaryTable).should('exist').first().within(() => {
      cy.contains('th', 'Assignment type').should('exist')
      cy.contains('th', 'Weight').should('exist')
      cy.contains('th', 'Grade').should('exist')
      cy.contains('th', 'Weighted grade').should('exist')
    })

    cy.contains('h3', 'Detailed grades').should('be.visible')
  }

  checkRelatedLinksSection() {
    cy.contains('h3', 'Related links').should('be.visible')

    cy.contains('a', 'Dates')
      .should('have.attr', 'href')
      .and('include', '/dates')

    cy.contains('a', 'Course outline')
      .should('have.attr', 'href')
      .and('include', '/home')
  }

  // ─── Certificate checks ──────────────────────────────────────────────────

  checkNoCertificateSection() {
    cy.get(this.certificateStatusSection).should('not.exist')
  }

  /**
   * Verify the certificate section is present and "View my certificate"
   * button links to the certificate page.
   */
  checkCertificateViewButton(courseId) {
    cy.get(this.certificateStatusSection)
      .should('be.visible')
      .and('have.attr', 'courseid', courseId)
    cy.get(this.certificateButton)
      .contains('View my certificate')
      .should('be.visible')
      .and('have.attr', 'href')
      .and('match', /\/certificates\//)
  }

  /**
   * Click "View my certificate" and verify the certificate page URL.
   */
  clickViewCertificate() {
    cy.get(this.certificateButton)
      .contains('View my certificate')
      .invoke('attr', 'href')
      .then((href) => {
        cy.visit(href)
        cy.url().should('include', '/certificates/')
      })
  }

  /**
   * On the certificate page, verify the "Download your certificate" button exists.
   */
  checkCertificateDownloadButton() {
    cy.contains('a', 'Download your certificate')
      .should('be.visible')
      .and('have.attr', 'href')
      .and('match', /\.pdf|\/certificates\//)
  }

  // ─── Certificate API helpers (Studio) ───────────────────────────────────

  /**
   * Create or update the course certificate via Studio API.
   */
  setCourseCertificate(courseId, certificateData) {
    const baseCmsUrl = Cypress.env('BASE_CMS_URL')
    const url = `${baseCmsUrl}/certificates/${courseId}`
    getCsrfToken().then(($token) => {
      cy.request({
        method: 'POST',
        url,
        body: certificateData,
        failOnStatusCode: false,
        headers: {
          ...getRequestHeaders(`${baseCmsUrl}/`, $token),
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 201])
      })
    })
  }

  /**
   * Activate or deactivate the course certificate via Studio API.
   */
  activateCourseCertificate(courseId, isActive) {
    const baseCmsUrl = Cypress.env('BASE_CMS_URL')
    const url = `${baseCmsUrl}/certificates/activation/${courseId}/`
    getCsrfToken().then(($token) => {
      cy.request({
        method: 'POST',
        url,
        body: { is_active: isActive },
        failOnStatusCode: false,
        headers: {
          ...getRequestHeaders(`${baseCmsUrl}/`, $token),
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    })
  }

  /**
   * Fetch the ID of the first certificate defined for a course.
   * Resolves via .then() with the certificate ID (number) or null.
   */
  getCourseCertificateId(courseId) {
    const baseCmsUrl = Cypress.env('BASE_CMS_URL')
    return getCsrfToken().then(($token) => cy.request({
      method: 'GET',
      url: `${baseCmsUrl}/certificates/${courseId}`,
      failOnStatusCode: false,
      headers: {
        ...getRequestHeaders(`${baseCmsUrl}/`, $token),
      },
    }).then((response) => {
      if (response.status === 200 && response.body.certificates?.length) {
        return response.body.certificates[0].id
      }
      return null
    }))
  }

  /**
   * Delete a specific certificate by ID for a given course.
   */
  deleteCourseCertificate(courseId, certificateId) {
    const baseCmsUrl = Cypress.env('BASE_CMS_URL')
    const url = `${baseCmsUrl}/certificates/${courseId}/${certificateId}`
    getCsrfToken().then(($token) => {
      cy.request({
        method: 'DELETE',
        url,
        failOnStatusCode: false,
        headers: {
          ...getRequestHeaders(`${baseCmsUrl}/`, $token),
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204])
      })
    })
  }
}

export default CourseProgressPage
