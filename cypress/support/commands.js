import CourseInstructorPage from '../pages/lms/courseInstructorPage'
import TeacherDashboardPage from '../pages/lms/teacherDashboardPage'

const courseInstructorPage = new CourseInstructorPage()
const teacherDashboardPage = new TeacherDashboardPage()

Cypress.on('uncaught:exception', () => false)
// returning false here prevents Cypress from
// failing the test

Cypress.Commands.add('signin', (sessionName, userEmail, userPassword, { cacheSession = true } = {}) => {
  const loginUrl = Cypress.env('loginUrl', '/login')
  const login = () => {
    cy.visit(Cypress.config().baseUrl)
    cy.getCookie('csrftoken').its('value').then(($token) => {
      cy.request({
        method: 'POST',
        url: Cypress.env('login_api_url', '/login_ajax'),
        form: true,
        body: {
          email: userEmail,
          password: userPassword,
          remember: false,
        },
        headers: {
          Referer: Cypress.config().baseUrl + loginUrl,
          'X-CSRFToken': $token,
        },
      })
    })
  }
  if (cacheSession) {
    cy.session(sessionName, login)
  } else {
    login()
  }
})

Cypress.Commands.add('loginAdmin', (sessionName = 'staff', { cacheSession = true } = {}) => {
  cy.signin(sessionName, Cypress.env('ADMIN_USER_EMAIL'), Cypress.env('ADMIN_USER_PASSWORD'), cacheSession)
})

Cypress.Commands.add('loginAdminLmsCms', (sessionName = 'staffCMS', { cacheSession = true } = {}) => {
  const login = () => {
    cy.session('staffCMS', () => {
      cy.loginAdmin()
      cy.visit({ url: Cypress.env('BASE_CMS_URL'), method: 'GET' }).then(() => {
      })
    })
  }
  if (cacheSession) {
    cy.session(sessionName, login)
  } else {
    login()
  }
})

Cypress.Commands.add('changeEnrollment', (courseId, enrollmentAction) => {
  const changeEnrollUrl = Cypress.env('enroll_url', '/change_enrollment')
  cy.getCookie('csrftoken').its('value').then(($token) => {
    cy.request({
      method: 'POST',
      url: changeEnrollUrl,
      form: true,
      body: {
        course_id: courseId,
        enrollment_action: enrollmentAction,
      },
      headers: {
        Referer: Cypress.config().baseUrl + changeEnrollUrl,
        'X-CSRFToken': $token,
      },
    }).then(
      (response) => response.body.status,
    )
  })
})

Cypress.Commands.add('createEmptyCourse', (courseData) => {
  const createCourseUrl = Cypress.env('course_url', '/course')
  cy.getCookie('csrftoken').its('value').then(($token) => {
    cy.request({
      method: 'POST',
      url: createCourseUrl,
      body: courseData,
      headers: {
        'X-CSRFToken': $token,
        Referer: Cypress.config().baseUrl,
        'Content-Type': 'application/json',
      },
    }).then(
      (response) => response.body.status,
    )
  })
})

Cypress.Commands.add('deleteXBlock', (blockLocator) => {
  cy.log(`Deleting XBlock with locator: ${blockLocator}`)
  const deleteXBlockUrl = Cypress.env('delete_xblock_url', '/xblock')
  const deleteUrl = `${deleteXBlockUrl}/${blockLocator}`
  cy.getCookie('csrftoken').its('value').then(($token) => {
    cy.request({
      method: 'DELETE',
      url: deleteUrl,
      headers: {
        'X-CSRFToken': $token,
        Referer: Cypress.config().baseUrl,
      },
    }).then(
      (response) => response.status,
    )
  })
})

Cypress.Commands.add('changeEnrollmentSafe', (courseId, enrollmentAction) => {
  const changeEnrollUrl = Cypress.env('enroll_url', '/change_enrollment')

  const executeChangeEnrollment = () => {
    cy.getCookie('csrftoken').its('value').then(($token) => {
      cy.request({
        method: 'POST',
        url: changeEnrollUrl,
        form: true,
        body: {
          course_id: courseId,
          enrollment_action: enrollmentAction,
        },
        headers: {
          Referer: Cypress.config().baseUrl + changeEnrollUrl,
          'X-CSRFToken': $token,
        },
      }).then(
        (response) => response.body.status,
      )
    })
  }

  if (enrollmentAction === 'enroll') {
    cy.request({
      method: 'GET',
      url: `/api/enrollment/v1/enrollment/${courseId}`,
      failOnStatusCode: false,
    }).then((response) => {
      const isEnrolled = response.status === 200 && response.body.is_active === true

      if (isEnrolled) {
        cy.log(`User is already enrolled in ${courseId}. Skipping enrollment request.`)
      } else {
        cy.log(`User is NOT enrolled (Status: ${response.status}). Proceeding to enroll...`)
        executeChangeEnrollment()
      }
    })
  } else {
    executeChangeEnrollment()
  }
})

Cypress.Commands.add('solveGoogleReCAPTCHA', () => {
  // Wait until the iframe (Google reCAPTCHA) is totally loaded
  cy.get('#g-recaptcha *> iframe', { timeout: 10000 })
    .then($iframe => {
      const $body = $iframe.contents().find('body')
      cy.wrap($body)
        .find('.recaptcha-checkbox-border')
        .should('be.visible')
        .click()
    })
})

Cypress.Commands.add('waitForNewCourse', ({ previousIds, retries = 10, delay = 3000 }) => {
  if (retries === 0) {
    throw new Error('New course was not created in time')
  }

  cy.request({
    method: 'GET',
    url: `${Cypress.env('BASE_URL')}/meta_user/api/v1/instructor-courses/`,
  }).then((res) => {
    expect(res.status).to.eq(200)

    const currentIds = res.body.results.map(c => c.id)
    const newIds = currentIds.filter(id => !previousIds.includes(id))

    if (newIds.length > 0) {
      cy.log(`New course found: ${newIds[0]}`)
      cy.wrap(newIds[0]).as('courseId')
    } else {
      cy.log('Waiting for new course...')
      cy.wait(delay)
      cy.waitForNewCourse({ previousIds, retries: retries - 1, delay })
    }
  })
})

Cypress.Commands.add('deleteCopiedCourse', () => {
  cy.visit(`${Cypress.env('BASE_URL')}/courses`)
  cy.getCookie('csrftoken').its('value').then(($token) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('BASE_URL')}/meta_user/api/v1/delete-course/`,
      body: {
        course_id: Cypress.env('clonedCourseId'),
      },
      headers: {
        Referer: `${Cypress.config().baseUrl}/meta_user/api/v1/delete-course/`,
        'X-CSRFToken': $token,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
    })
  })
})

Cypress.Commands.add('loginTeacher', () => {
  cy.visit(`${Cypress.env('BASE_MFE_URL')}/authn/login`)
  cy.signin('test user', Cypress.env('TEACHER_USER_EMAIL'), Cypress.env('TEACHER_USER_PASSWORD'))
})

Cypress.Commands.add('loginLmsUser', () => {
  cy.visit(`${Cypress.env('BASE_MFE_URL')}/authn/login`)
  cy.signin('test user', Cypress.env('LMS_USER_EMAIL'), Cypress.env('LMS_USER_PASSWORD'))
})

Cypress.Commands.add('studentEnroll', (shouldEnroll) => {
  cy.visit(`${Cypress.env('BASE_MFE_URL')}/teacher-dashboard/courses`)
  teacherDashboardPage.getCopiedCourseInviteButton().first().click()
  cy.url().should('include', Cypress.env('clonedCourseId'))
  cy.url().should('include', '/instructor#view-membership')
  cy.intercept('POST', '**/students_update_enrollment').as('enrollStudent')
  courseInstructorPage.setStudentId(Cypress.env('LMS_USER_EMAIL'))
  if (shouldEnroll) {
    courseInstructorPage.clickStudentEnrollButton()
  } else {
    courseInstructorPage.clickStudentUnenrollButton()
  }
  cy.wait('@enrollStudent')
    .its('response')
    .then((res) => {
      expect(res.statusCode).to.eq(200)

      const result = res.body.results[0]

      expect(result.after.enrollment, 'user enrolled').to.eq(!!shouldEnroll)
      expect(result.before.enrollment, 'was not enrolled before').to.eq(!shouldEnroll)
    })
})
