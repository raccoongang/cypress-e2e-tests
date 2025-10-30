import ForgotPasswordPage from '../../../pages/lms/auth/forgotPasswordPage'
import LoginPage from '../../../pages/lms/auth/loginPage'

describe('Forgot password page tests', function () {
  const forgotPasswordPage = new ForgotPasswordPage()
  const loginPage = new LoginPage()

  before(function () {
    cy.clearCookies()
  })

  beforeEach(function () {
    const baseURL = Cypress.env('BASE_MFE_URL')
    cy.visit(`${baseURL}/authn/login`)
    loginPage.clickForgotPassword()
  })

  describe('[TC_LEARNER_10] Existing user has a way to login to their account if they forget their password', { tags: '@regression' }, function () {
    it('check forgot password flow', function () {
      cy.contains('Скинути Пароль')
      forgotPasswordPage.checkForgotPasswordFormStructure()
      forgotPasswordPage.recoverPassword(Cypress.env('LMS_USER_EMAIL'))
      forgotPasswordPage.getErrorMessageTitle().should('contain.text', 'Перевірте свою пошту')
      // ToDo: when receiving the email, the user should be able to reset their password and log in
    })
  })

  describe('Fields validation check', { tags: '@regression' }, function () {
    const errMsg = {
      mainErrMsg: 'Нам не вдалося зв\'язатися з Вами.',
      emailErrMsg: 'Введіть Вашу адресу електронної пошти',
      emailErrMsgMin: 'Введіть введіть дійсну адресу електронної пошти',
      successMsg: 'Перевірте свою пошту',
      retryErrMsgMain: 'Сталася помилка.',
      retryErrMsg: 'Ваш попередній запит у процесі обробки. Повторіть спробу за кілька хвилин.',
      helpTextMsg: `Електронна пошта, яку Ви використовували для реєстрації на ${Cypress.env('PLATFORM_NAME')}`,
    }
    const userInfo = {
      minEmail: '1',
    }

    it('should show correct reset password form structure', function () {
      cy.contains('Скинути Пароль')
      cy.contains('Будь ласка, введіть свою адресу електронної пошти нижче, і ми надішлемо Вам інструкції зі встановлення нового пароля.')
      forgotPasswordPage.checkForgotPasswordFormStructure()
      cy.contains(`Щоб отримати додаткову допомогу, зверніться до служби підтримки ${Cypress.env('PLATFORM_NAME')} за адресою`)
      forgotPasswordPage.checkTechSupportLink()
      forgotPasswordPage.getEmailHelpMsg()
      forgotPasswordPage.getAllErrors().eq(0).should('contain.text', errMsg.helpTextMsg)
    })

    it('should have error messages for empty Email field', function () {
      forgotPasswordPage.recoverPassword()
      forgotPasswordPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrMsg)
      forgotPasswordPage.getAllErrors().eq(1).should('contain.text', errMsg.emailErrMsg)
    })

    it('should have error messages for min Email input field', function () {
      forgotPasswordPage.recoverPassword(userInfo.minEmail)
      forgotPasswordPage.getErrorMessageTitle().should('contain.text', errMsg.mainErrMsg)
      forgotPasswordPage.getAllErrors().eq(1).should('contain.text', errMsg.emailErrMsgMin)
    })

    it('should redirect to Login page', function () {
      forgotPasswordPage.clickSignIn()
      cy.location().should((loc) => {
        expect(loc.pathname.toString()).to.contain('/login')
      })
    })

    it('should contain error messages for retry recover password', function () {
      forgotPasswordPage.recoverPassword(Cypress.env('LMS_USER_EMAIL'))
      forgotPasswordPage.getErrorMessageTitle().should('contain.text', errMsg.retryErrMsgMain)
      forgotPasswordPage.getErrorMessageTitle().should('contain.text', errMsg.retryErrMsg)
    })
  })
})
