/**
 * Blacklisted public email provider domains.
 *
 * These domains cannot be used for organization auto-join
 * to prevent anyone with a common email from joining automatically.
 */
export const BLACKLISTED_DOMAINS: ReadonlySet<string> = new Set([
  // Global providers
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'ymail.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',

  // Privacy / encrypted
  'protonmail.com',
  'proton.me',
  'pm.me',
  'tutanota.com',
  'tuta.com',
  'tutamail.com',

  // Czech / Slovak
  'seznam.cz',
  'email.cz',
  'post.cz',
  'centrum.cz',
  'volny.cz',
  'atlas.cz',
  'azet.sk',
  'zoznam.sk',
  'pobox.sk',

  // German
  'gmx.de',
  'gmx.net',
  'web.de',
  't-online.de',
  'freenet.de',

  // French
  'orange.fr',
  'free.fr',
  'laposte.net',
  'sfr.fr',

  // Russian
  'mail.ru',
  'yandex.ru',
  'yandex.com',
  'rambler.ru',

  // Chinese
  'qq.com',
  '163.com',
  '126.com',

  // Other regional
  'libero.it',
  'virgilio.it',
  'wp.pl',
  'o2.pl',
  'interia.pl',
  'rediffmail.com',
  'zoho.com',

  // Temporary / disposable
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamailblock.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email',
  'temp-mail.org',
  '10minutemail.com',
  'sharklasers.com',
  'grr.la',
  'dispostable.com',
  'yopmail.com',
  'trashmail.com',
  'maildrop.cc',
]);
