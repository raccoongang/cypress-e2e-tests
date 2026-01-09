import RegisterPage from '../../../pages/lms/auth/registerPage'
import randomString from '../../../support/utils'

describe('Registration page tests', function () {
  const registerPage = new RegisterPage()
  const randomUsername = randomString(10)

  const userInfo = {
    fullName: 'Full Name',
    fullNameMax: randomString(260),
    email: `${randomUsername}@example.com`,
    existingEmail: Cypress.env('ADMIN_USER_EMAIL'),
    minEmail: '1',
    username: randomUsername,
    minUsername: '1',
    existingUsername: 'admin',
    wrongUsername: '!@#',
    publicUsernameText: randomString(40),
    password: 'somePassword1',
    minPassword: '1',
    passwordMax: randomString(75),
  }

  before(function () {
    cy.clearCookies()
  })

  beforeEach(function () {
    const baseURL = Cypress.env('BASE_MFE_URL')
    cy.visit(`${baseURL}/authn/register`)
  })

  describe('[TC_LEARNER_8] New user registers for an account', { tags: '@smoke' }, function () {
    it('should show correct register form structure', function () {
      registerPage.checkRegisterFormStructure()
    })

    it('new user registers for an account', function () {
      if (!Cypress.env('ENABLE_REGISTER_NEW_USER')) {
        this.skip()
      }
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        userInfo.email,
        userInfo.publicUsernameText,
        userInfo.password,
      )
      registerPage.clickRegisterButton()
      cy.url().should('contain', 'learner-dashboard')

      // ToDo: need to check confirm registration email
    })
  })

  describe('Fields validation check', { tags: '@regression' }, function () {
    const errMsg = {
      mainErrMsg: 'Ми не змогли створити Ваш обліковий запис',
      mainErrDescription: 'Будь ласка, перевірте свої відповіді та повторіть спробу.',
      fullNameErrMsg: 'Введіть своє ім’я повністю',
      usernameErrMsg: 'Iм\'я користувача повинно мати від 2 до 30 символів',
      usernameErrMsgWrong: 'Імена користувачів можуть містити лише літери (A-Z, a-z), цифри (0-9), підкреслення (_) та дефіси (-). Імена користувачів не можуть містити пробілів.',
      usernameErrMsgExisting: 'Вказане ім’я користувача вже зайняте.',
      emailErrMsg: 'Введіть Вашу адресу електронної пошти',
      emailErrMsgExisting: 'Ця електронна адреса вже пов\'язана з існуючим обліковим записом',
      emailErrMsgWrong: 'Введіть введіть дійсну адресу електронної пошти',
      passwordErrMsg: 'Критерії пароля не виконано',
      passwordErrMsgMax: 'Цей пароль задовгий. Він має містити не більше 75 символів.',
      similarPasswordErrMsg: 'Пароль надто схожий на ім’я користувача.',
    }

    const descMsg = {
      fullNameDesc: 'Це ім\'я буде використано у кожному отриманому сертифікаті',
      usernameDescFirstLine: 'Ім\'я, за яким Вас будуть ідентифікувати в системі.',
      usernameDescSecondLine: 'Його неможливо змінити пізніше.',
      emailDesc: 'Для активації облікового запису та важливих оновлень',
      passwordDescFistLine: '1 літера',
      passwordDescSecondLine: '1 цифра',
      passwordDescThirdLine: '8 символів',
    }

    it('should contain error messages for empty input', function () {
      registerPage.prepareUserRegistration()
      registerPage.clickRegisterButton()
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrMsg)
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrDescription)
      registerPage.getFieldError('name').should('contain.text', errMsg.fullNameErrMsg)
      registerPage.getFieldError('email').should('contain.text', errMsg.emailErrMsg)
      registerPage.getFieldError('username').should('contain.text', errMsg.usernameErrMsg)
      registerPage.getFieldError('password').should('contain.text', errMsg.passwordErrMsg)
    })

    // ---Full name---
    it('should be visible Full name description field', function () {
      registerPage.getFieldDescription('name', descMsg.fullNameDesc)
    })

    it('check Full name field max length', function () {
      registerPage.checkMaxFullName(userInfo.fullNameMax)
    })

    it('should contain error messages for Full Name empty field', function () {
      registerPage.prepareUserRegistration(
        '{ESC}',
        userInfo.email,
        userInfo.username,
        userInfo.password,
      )
      registerPage.clickRegisterButton()
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrMsg)
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrDescription)
      registerPage.getFieldError('name').should('contain.text', errMsg.fullNameErrMsg)
    })

    // ---Email---
    it('should be visible Email description field', function () {
      registerPage.getFieldDescription('email', descMsg.emailDesc)
    })

    it('should contain error message for existing Email input', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        userInfo.existingEmail,
        userInfo.username,
        userInfo.password,
      )
      registerPage.registerUser()
      registerPage.getFieldError('email').should('contain.text', errMsg.emailErrMsgExisting)
    })

    it('should contain error message for Email min length input', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        userInfo.minEmail,
        userInfo.username,
        userInfo.password,
      )
      registerPage.clickRegisterButton()
      registerPage.getFieldError('email').should('contain.text', errMsg.emailErrMsgWrong)
    })

    it('should contain error messages for empty fields: Email', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        '{ESC}',
        userInfo.username,
        userInfo.password,
      )
      registerPage.clickRegisterButton()
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrMsg)
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrDescription)
      registerPage.getFieldError('email').should('contain.text', errMsg.emailErrMsg)
    })

    // ---Public username---
    it('should be visible Public username description field', function () {
      registerPage.getFieldDescription('username', descMsg.usernameDescFirstLine)
      registerPage.getFieldDescription('username', descMsg.usernameDescSecondLine)
    })

    it('should contain error message for Public username min length input', function () {
      registerPage.prepareUserRegistration(
        '{ESC}',
        '{ESC}',
        userInfo.minUsername,
      )
      registerPage.clickRegisterButton()
      registerPage.getFieldError('username').should('contain.text', errMsg.usernameErrMsg)
    })

    it('check Public Username max 30 symbols', function () {
      registerPage.checkUsername(userInfo.publicUsernameText)
    })

    it('should contain error message for Public username incorrect symbols input', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        userInfo.email,
        userInfo.wrongUsername,
        userInfo.password,
      )
      registerPage.clickRegisterButton()
      registerPage.getFieldError('username').should('contain.text', errMsg.usernameErrMsgWrong)
    })

    it('should contain error message for existing Public username input', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        userInfo.email,
        userInfo.existingUsername,
        userInfo.password,
      )
      registerPage.clickRegisterButton()
      registerPage.getFieldError('username').should('contain.text', errMsg.usernameErrMsgExisting)
    })

    it('should contain error messages for empty fields: Public username', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        userInfo.email,
        '{ESC}',
        userInfo.password,
      )
      registerPage.clickRegisterButton()
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrMsg)
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrDescription)
      registerPage.getFieldError('username').should('contain.text', errMsg.usernameErrMsg)
    })

    // ---Password---
    it('should be visible Password description field', function () {
      registerPage.getFieldDescription('password', descMsg.passwordDescFistLine)
      registerPage.getFieldDescription('password', descMsg.passwordDescSecondLine)
      registerPage.getFieldDescription('password', descMsg.passwordDescThirdLine)
    })

    it('should contain error message for Password max length field', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        `${randomString(6)}@example.com`,
        userInfo.username,
        `${userInfo.passwordMax}_1`,
      )
      registerPage.clickRegisterButton()
      registerPage.getFieldError('password').should('contain.text', errMsg.passwordErrMsgMax)
    })

    it('should contain error message for Password min length field', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        `${randomString(6)}@example.com`,
        userInfo.username,
        userInfo.minPassword,
      )
      registerPage.clickRegisterButton()
      registerPage.getFieldError('password').should('contain.text', errMsg.passwordErrMsg)
    })

    it('should contain error message for Password is too similar with username', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        `${randomString(6)}@example.com`,
        userInfo.username,
        `${userInfo.username}_1`,
      )
      registerPage.registerUser()
      registerPage.getFieldError('password').should('contain.text', errMsg.similarPasswordErrMsg)
    })

    it('should contain error messages for empty fields: Password', function () {
      registerPage.prepareUserRegistration(
        userInfo.fullName,
        `${randomString(6)}@example.com`,
        userInfo.username,
        '{ESC}',
      )
      registerPage.clickRegisterButton()
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrMsg)
      registerPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrDescription)
      registerPage.getFieldError('password').should('contain.text', errMsg.passwordErrMsg)
    })
  })
})
