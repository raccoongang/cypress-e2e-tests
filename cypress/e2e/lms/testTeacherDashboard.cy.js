import TeacherDashboardPage from '../../pages/lms/teacherDashboardPage'
import { COPYING_COURSE_DATA } from '../../support/constants'

const teacherDashboardPage = new TeacherDashboardPage()
const baseURL = Cypress.env('BASE_MFE_URL')
const COURSE_IS_CLONING = 1

describe('Teacher Dashboard for Teacher', function () {
  before(function () {
    cy.clearCookies()
  })

  describe('Main', function () {
    beforeEach(function () {
      cy.loginTeacher()
      cy.visit(`${baseURL}/teacher-dashboard/`)
    })

    describe('[C244239] Copy course as a teacher', { tags: '@smoke' }, function () {
      let initialCourseIds = []

      before(() => {
        cy.loginTeacher()
        // snapshot before copying
        cy.request(`${Cypress.env('BASE_URL')}/meta_user/api/v1/instructor-courses/?course_type_filter=all_courses`)
          .then(res => {
            initialCourseIds = res.body.results.map(course => course.id)
          })
      })

      it('Teacher can make a course copy', function () {
        cy.visit(`${baseURL}/teacher-dashboard/course-cloning`)

        cy.intercept(
          'POST',
          '/meta_user/api/v1/course_rerun/',
        ).as('courseRerun')

        teacherDashboardPage.setCourseClass(COPYING_COURSE_DATA.courseClass)
        teacherDashboardPage.setCourseSubject(COPYING_COURSE_DATA.courseSubject)
        teacherDashboardPage.setCourseDropdown(COPYING_COURSE_DATA.courseName)
        cy.solveGoogleReCAPTCHA()
        teacherDashboardPage.getSubmitButton()
        teacherDashboardPage.checkCopyStatusMessage()

        cy.wait('@courseRerun')
          .its('response')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body.code).to.eq(COURSE_IS_CLONING)
          })
      })

      it('Waits until copied course appears', () => {
        cy.then(() => {
          cy.waitForNewCourse({
            previousIds: initialCourseIds,
            retries: 12,
            delay: 3000,
          })
        })

        cy.get('@courseId').should('exist')
        cy.get('@courseId').then(value => {
          Cypress.env('clonedCourseId', value) // Save it temporarily
        })
      })

      it('Test clonedCourseId', function () {
        cy.log(Cypress.env('clonedCourseId'))
      })
    })

    describe('[C244240] Invite user o the copied course', function () {
      it('Teacher can invite a user to copied course', function () {
        cy.visit(`${baseURL}/teacher-dashboard/courses`)
        teacherDashboardPage.getCopiedCourseInviteButton()
      })
    })
  })

  describe('', function () {

  })

  after(function () {
    cy.loginTeacher()
    cy.deleteCopiedCourse()
  })
})
