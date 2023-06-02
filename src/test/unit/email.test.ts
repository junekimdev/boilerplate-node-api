import { isEmailValid } from '../../utils/email';

// https://www.w3resource.com/javascript/form/email-validation.php
// https://gist.github.com/cjaoude/fd9910626629b53c4d25

const validEmails = [
  'email@example.com', // regular

  'firstname.lastname@example.com', // dot in local-part
  '1234567890@example.com', // numbers only in local-part
  'x@example.com', // single character in local-part

  'email@subdomain.example.com', // subdomain
  'email@example.name', // unusual domain
  'email@example.museum', // unusual domain
  'example@s.example', // single character in domain

  'email@example-one.com', // hyphen in domain
  'firstname-lastname@example.com', // hyphen in local-part
  'example-indeed@strange-example.com', // hyphens in both

  'firstname+lastname@example.com', // legal character in local-part
  'user%example.com@example.org', // legal character in local-part
  '_______@example.com', // legal character in local-part
  'user-@example.org', // legal character in local-part
  'disposable.style.email.with+symbol@example.com', // legal character in local-part
  'other.email-with-hyphen@and.subdomains.example.com', // legal character in local-part
  'fully-qualified-domain@example.com', // legal character in local-part
  'user.name+tag+sorting@example.com', // legal character in local-part
  'test/test@test.com', // legal character in local-part
  'mailhost!username@example.org', // bangified host route used for uucp mailers

  '"email"@example.com', // fully quoted local-part
  '" "@example.org', // space in quoted local-part
  '"   "@example.org', // spaces in quoted local-part
  '"abc@"@example.org', // @ sign in quoted local-part
  '"very.(),:;<>[].VERY.very@\\ very.unusual"@strange.example.com', // fully quoted local-part

  '한글@example.com', // unicode character in local-part
  'あいうえお@example.com', // unicode character in local-part
  '한글@도메인.com', // unicode character in domain
];

const vaildButNotAllowed = [
  'admin@mailserver1', // local domain name with no TLD
  'postmaster@[123.123.123.123]', // IP address in square brackets
  'postmaster@[IPv6:2001:0db8:85a3:0000:0000:8a2e:0370:7334]', // IP address in square brackets
  'john.smith@(comment)example.com', // comment in domain name
  'john.smith@example.com(comment)', // comment in domain name
  '"john..doe"@example.org', // double dot in quoted local-part
  'much."more unusual"@example.com', // partically quoted local-part
  'very.unusual."@".unusual.com@example.com', // partically quoted local-part
  '"very.(),:;<>[]".VERY."very@\\ "very".unusual"@strange.example.com', // quotations within quotations
];

const invalidEmails = [
  'plainaddress', // no at sign and domain
  '@example.com', // no local-part
  'email.example.com', // no at sign
  'email@example@example.com', // double at sign
  '#@%^%#$@#$@#.com', // non-letters character in domain
  'email@-example.com', // start with minus sign
  'email@123.123.123.123', // IP address without square brackets
  'email@111.222.333.44444', // invalid ip address
  '.email@example.com', // start with dot
  'email.@example.com', // end with dot
  'email..email@example.com', // double dots in local-part
  'email@example..com', // double dots in domain
  '"(),:;<>[]@example.com', // non-quoted illegal characters
  'Joe Smith <email@example.com>', // not email
];

describe('Test /src/util/email', () => {
  describe('undefined case', () => {
    it('should return false', () => {
      const email = undefined;
      expect(isEmailValid(email)).toBeFalsy();
    });
  });

  describe('valid cases', () => {
    it.each(validEmails)('%s should be true', (email) => expect(isEmailValid(email)).toBeTruthy());
  });

  describe('valid but not allowed cases', () => {
    it.each(vaildButNotAllowed)('%s should be false', (email) =>
      expect(isEmailValid(email)).toBeFalsy(),
    );
  });

  describe('invalid cases', () => {
    it.each(invalidEmails)('%s should be false', (email) =>
      expect(isEmailValid(email)).toBeFalsy(),
    );
  });
});
