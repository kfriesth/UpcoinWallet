/**
 * Setup of main AngularJS application, with Restangular being defined as a dependency.
 *
 * @see controllers
 * @see services
 */

// mock methods to implement late binding
var __mockShowError = function(message) {};
var __mockValidateAddress = function(address) {};

var app = angular.module('app', [
    'restangular',
    'waves.core',

    'ngclipboard',
    'ngAnimate',
    'ngMaterial',
    'ngValidate',
    'app.ui',
    'app.shared',
    'app.login',
    'app.navigation',
    'app.wallet',
    'app.tokens',
    'app.history',
    'app.community',
    'app.portfolio'
]).config(AngularApplicationConfig).run(AngularApplicationRun);

function AngularApplicationConfig($provide, $compileProvider, $validatorProvider, $qProvider, $mdAriaProvider,
                                  networkConstants, applicationSettings) {
    $provide.constant(networkConstants,
        angular.extend(networkConstants, {
            NETWORK_NAME: 'devel',
            NETWORK_CODE: 'D'
        }));
    $provide.constant(applicationSettings,
        angular.extend(applicationSettings, {
            CLIENT_VERSION: '0.4.1a',
            NODE_ADDRESS: 'http://34.251.200.245:6869'
        }));

    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|file|chrome-extension):/);
    $qProvider.errorOnUnhandledRejections(false);

    // Globally disables all ARIA warnings.
    $mdAriaProvider.disableWarnings();

    $validatorProvider.setDefaults({
        errorClass: 'wInput-error',
        onkeyup: false,
        showErrors : function(errorMap, errorList) {
            errorList.forEach(function(error) {
                // can't use notificationService here cos services are not available in config phase
                __mockShowError(error.message);
            });

            var i, elements;
            for (i = 0, elements = this.validElements(); elements[i]; i++) {
                angular.element(elements[i]).removeClass(this.settings.errorClass);
            }

            for (i = 0, elements = this.invalidElements(); elements[i]; i++) {
                angular.element(elements[i]).addClass(this.settings.errorClass);
            }
        }
    });
    $validatorProvider.addMethod('address', function (value, element) {
        return this.optional(element) || __mockValidateAddress(value);
    }, 'Номер аккаунта должен быть последовательностью из 35 буквенно-числовых символов, без пробелов, ' +
        'и может начинаться с \'1W\'');
    $validatorProvider.addMethod('decimal', function (value, element, params) {
        var maxdigits = angular.isNumber(params) ? params : Currency.WAV.precision;

        var regex = new RegExp('^(?:-?\\d+)?(?:\\.\\d{0,' + maxdigits + '})?$');
        return this.optional(element) || regex.test(value);
    }, 'Сумма должна содержать точку (.) в качестве десятичного разделителя с не более, чем {0} знаков после нуля');
    $validatorProvider.addMethod('password', function (value, element) {
        if (this.optional(element))
            return true;

        var containsDigits = /[0-9]/.test(value);
        var containsUppercase = /[A-Z]/.test(value);
        var containsLowercase = /[a-z]/.test(value);

        return containsDigits && containsUppercase && containsLowercase;
    }, 'Пароль слишком слабый. Хороший пароль должен содержать, как минимум, одну цифру, ' +
        'одну заглавную и одну строчную букву.');
    $validatorProvider.addMethod('minbytelength', function (value, element, params) {
        if (this.optional(element))
            return true;

        if (!angular.isNumber(params))
           throw new Error('Параметр minbytelength должен быть числом. Получено: ' + params);

        var minLength = params;
        return converters.stringToByteArray(value).length >= minLength;
    }, 'Строка слишком короткая. Пожалуйста, добавьте больше символов.');
    $validatorProvider.addMethod('maxbytelength', function (value, element, params) {
        if (this.optional(element))
            return true;

        if (!angular.isNumber(params))
            throw new Error('Параметр maxbytelength должен быть числом. Получено: ' + params);

        var maxLength = params;
        return converters.stringToByteArray(value).length <= maxLength;
    }, 'Строка слишком длинная. Пожалуйста, удалите часть символов.');
}

AngularApplicationConfig.$inject = ['$provide', '$compileProvider', '$validatorProvider', '$qProvider',
    '$mdAriaProvider', 'constants.network', 'constants.application'];

function AngularApplicationRun(rest, applicationConstants, notificationService, addressService) {
    // restangular configuration
    rest.setDefaultHttpFields({
        timeout: 10000 // milliseconds
    });
    var url = applicationConstants.NODE_ADDRESS;
    //var url = 'http://52.28.66.217:6869';
    //var url = 'http://52.77.111.219:6869';
    //var url = 'http://127.0.0.1:6869';
    //var url = 'http://127.0.0.1:8089';
    rest.setBaseUrl(url);

    // override mock methods cos in config phase services are not available yet
    __mockShowError = function (message) {
        notificationService.error(message);
    };
    __mockValidateAddress = function (address) {
        return addressService.validateAddress(address);
    };
}

AngularApplicationRun.$inject = ['Restangular', 'constants.application', 'notificationService', 'addressService'];

