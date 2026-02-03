import CourseProgressPage from '../../../pages/lms/courseHome/courseProgressPage'
import { DEMO_COURSE_DATA } from '../../../support/constants'

const { courseId } = DEMO_COURSE_DATA
const courseProgressPage = new CourseProgressPage()
const baseMFEURL = Cypress.env('BASE_MFE_URL')

const certificatePayload = {
  course_title: '',
  signatories: [
    {
      name: '',
      title: '',
      organization: '',
      signature_image_path: '',
      certificate: null,
    },
  ],
  description: 'Description of the certificate',
  editing: true,
  is_active: false,
  name: 'Name of the certificate',
  version: 1,
}

function setupCertificate() {
  cy.clearAllCookies()
  cy.loginAdminLmsCms()
  courseProgressPage.setCourseCertificate(courseId, certificatePayload)
  courseProgressPage.activateCourseCertificate(courseId, true)
}

function cleanupCertificate() {
  cy.clearAllCookies()
  cy.loginAdminLmsCms()
  courseProgressPage.getCourseCertificateId(courseId).then((certId) => {
    if (certId) {
      courseProgressPage.activateCourseCertificate(courseId, false)
      courseProgressPage.deleteCourseCertificate(courseId, certId)
    }
  })
}

describe('[TC_LEARNER_41] Progress page tests', { tags: '@smoke' }, function () {
  before(function () {
    cy.clearAllCookies()
    cy.signin('learner', Cypress.env('LMS_USER_EMAIL'), Cypress.env('LMS_USER_PASSWORD'))
    cy.changeEnrollment(courseId, 'enroll')
  })

  after(function () {
    cy.clearAllCookies()
    cy.signin('learner', Cypress.env('LMS_USER_EMAIL'), Cypress.env('LMS_USER_PASSWORD'))
    cy.changeEnrollment(courseId, 'unenroll')
  })

  it('progress page is functioning properly', function () {
    cy.signin('learner', Cypress.env('LMS_USER_EMAIL'), Cypress.env('LMS_USER_PASSWORD'))
    courseProgressPage.goToCourseHomeFromDashboard(baseMFEURL, DEMO_COURSE_DATA.courseName, courseId)
    courseProgressPage.navigateToProgressTab()
    courseProgressPage.checkCourseProgressHeader()

    courseProgressPage.checkCourseCompletionSection()
    courseProgressPage.checkCourseCompletionChart()

    courseProgressPage.checkGradesSection()
    courseProgressPage.checkGradesBar()
    courseProgressPage.checkGradeSummary()

    courseProgressPage.checkRelatedLinksSection()
  })
})

describe('[TC_LEARNER_42] Certificate request button displaying', { tags: '@smoke' }, function () {
  before(setupCertificate)
  after(cleanupCertificate)

  beforeEach(function () {
    cy.clearAllCookies()
    cy.signin('learner', Cypress.env('LMS_USER_EMAIL'), Cypress.env('LMS_USER_PASSWORD'))
    cy.changeEnrollment(courseId, 'enroll')
  })

  afterEach(function () {
    cy.changeEnrollment(courseId, 'unenroll')
  })

  it('shows "View my certificate" button when course is passed and certificate is active', function () {
    cy.fixture('demo_course_progress.json').then((progressData) => {
      const passingProgress = {
        ...progressData,
        course_grade: {
          letter_grade: 'Pass',
          percent: 1,
          is_passing: true,
        },
        certificate_data: {
          cert_status: 'downloadable',
          cert_web_view_url: `/certificates/test-certificate-uuid-${courseId}`,
          download_url: null,
        },
      }
      cy.intercept('GET', '/api/course_home/progress/*', passingProgress).as('getProgress')
    })

    cy.visit(`${baseMFEURL}/learner-dashboard/`)
    cy.contains(DEMO_COURSE_DATA.courseName).click()
    cy.url().should('include', `/course/${courseId}/home`)

    courseProgressPage.navigateToProgressTab()
    cy.wait('@getProgress')

    courseProgressPage.checkCertificateViewButton(courseId)
  })

  it('does NOT show "View my certificate" button when course is not passed', function () {
    cy.fixture('demo_course_progress.json').then((progressData) => {
      cy.intercept('GET', '/api/course_home/progress/*', progressData).as('getProgress')
    })

    cy.visit(`${baseMFEURL}/learner-dashboard/`)
    cy.contains(DEMO_COURSE_DATA.courseName).click()
    cy.url().should('include', `/course/${courseId}/home`)

    courseProgressPage.navigateToProgressTab()
    cy.wait('@getProgress')

    courseProgressPage.checkNoCertificateSection()
  })
})

describe('[TC_LEARNER_43] View and download certificate', { tags: '@smoke' }, function () {
  const fakeCertUuid = 'test-certificate-uuid-demo'

  before(setupCertificate)
  after(cleanupCertificate)

  beforeEach(function () {
    cy.clearAllCookies()
    cy.signin('learner', Cypress.env('LMS_USER_EMAIL'), Cypress.env('LMS_USER_PASSWORD'))
    cy.changeEnrollment(courseId, 'enroll')

    cy.fixture('demo_course_progress.json').then((progressData) => {
      const passingProgress = {
        ...progressData,
        course_grade: {
          letter_grade: 'Pass',
          percent: 1,
          is_passing: true,
        },
        certificate_data: {
          cert_status: 'downloadable',
          cert_web_view_url: `/certificates/${fakeCertUuid}`,
          download_url: null,
        },
      }
      cy.intercept('GET', '/api/course_home/progress/*', passingProgress).as('getProgress')
    })

    cy.visit(`${baseMFEURL}/learner-dashboard/`)
    cy.contains(DEMO_COURSE_DATA.courseName).click()
    cy.url().should('include', `/course/${courseId}/home`)
    courseProgressPage.navigateToProgressTab()
    cy.wait('@getProgress')
  })

  afterEach(function () {
    cy.changeEnrollment(courseId, 'unenroll')
  })

  it('view certificate: "View my certificate" button links to the certificate page', function () {
    courseProgressPage.checkCertificateViewButton(courseId)

    cy.get(courseProgressPage.certificateButton)
      .contains('View my certificate')
      .should('have.attr', 'href')
      .and('include', `/certificates/${fakeCertUuid}`)
  })

  it('download certificate: certificate page shows a download button', function () {
    cy.intercept('GET', `/certificates/${fakeCertUuid}`, {
      statusCode: 200,
      body: `
      <html><body>
        <a href="/certificates/${fakeCertUuid}.pdf" id="download-certificate">
          Download your certificate
        </a>
      </body></html>
    `,
    }).as('certPage')

    courseProgressPage.clickViewCertificate()
    cy.wait('@certPage')

    courseProgressPage.checkCertificateDownloadButton()
  })
})
