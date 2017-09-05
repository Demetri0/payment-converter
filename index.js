'use strict'

const os   = require("os")
const fs   = require('fs')
const path = require('path')
const csv  = require('csv')

const SYMBOL = {
  COMMA: ',',
  EOL: os.EOL
}

const PRETTY_OUT_JSON   = true
const PRETTY_TAB_SIZE   = 2
const IN_FILE_ENCODING  = 'utf8'
const OUT_FILE_ENCODING = 'utf8'

function currencyToSymbol(cur){
  switch (cur) {
    case 'EUR':
      return '&euro;'
    case 'GBP':
      return '&pound;'
    default:
      return cur
  }
}
function currenciesToSymbols(currencies){
  let f_currencies = []
  for (let cur of currencies) {
    f_currencies.push( currencyToSymbol(cur) )
  }
  return f_currencies
}
function moneyFormat(money){
  let currencies = currenciesToSymbols(money.currencies).join('/')
  return `${currencies} ${money.value}`
}

function seknokFormat(seknok){
  return `${seknok.seknok.join('/')} ${seknok.value}`
}

const minmaxTemplate = (min, max) => {
  let str = ''

  if(min.money){
    str += `min: ${moneyFormat(min.money)}`
    if(min.seknok){
      str += '<br>'
    }
    str += '\n'
  }
  if(min.seknok){
    str += `${seknokFormat(min.seknok)}\n`
  }

  if(max.money || max.seknok){
    str += '<hr>\n'
  }

  if(max.money){
    str += `max: ${moneyFormat(min.money)}`
    if(max.seknok){
      str += '<br>'
    }
    str += '\n'
  }
  if(max.seknok){
    str += `${seknokFormat(min.seknok)}\n`
  }

  return str
}

function htmlEscape(str) {
    return str.replace(/&/g, '&amp;') // first!
              .replace(/>/g, '&gt;')
              .replace(/</g, '&lt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/`/g, '&#96;');
}
function html(literalSections, ...substs) {
    // Use raw literal sections: we don’t want
    // backslashes (\n etc.) to be interpreted
    let raw = literalSections.raw;

    let result = '';

    substs.forEach((subst, i) => {
        // Retrieve the literal section preceding
        // the current substitution
        let lit = raw[i];

        // In the example, map() returns an array:
        // If substitution is an array (and not a string),
        // we turn it into a string
        if (Array.isArray(subst)) {
            subst = subst.join('');
        }

        // If the substitution is preceded by a dollar sign,
        // we escape special characters in it
        if (lit.endsWith('$')) {
            subst = htmlEscape(subst);
            lit = lit.slice(0, -1);
        }
        result += lit;
        result += subst;
    });
    // Take care of last literal section
    // (Never fails, because an empty template string
    // produces one literal section, an empty string)
    result += raw[raw.length-1]; // (A)

    return result;
}

const mobilePaymentTemplate = methods => {
  return html`
  <accordion id="faq-accordion" close-others="false">
  ${methods.map(method => {
    return html`
    <!-- ${method.title} -->
    <accordion-group is-open="false">
        <accordion-heading>
            <div class="bankingItem__header">
                <img height="32" src="${method.image}" alt="${method.title}" class="staticPageWrapper__paymentImage">
            </div>
        </accordion-heading>
        <div class="accordion-body filter-text-content">
            <div class="bankingItem__body">
                <div class="bankingItem__property">
                    <div class="bankingItem__propertyKey">Deposit</div>
                    <div class="bankingItem__propertyValue">
                        <img width="24" height="24" src="/cms/images/icons/general-icons/${(method.isDeposit)?'yes.png':'no.svg'}" alt="${(method.isDeposit)?'Yes':'No'}">
                    </div>
                </div>
                <div class="bankingItem__property">
                    <div class="bankingItem__propertyKey">Withdraw</div>
                    <div class="bankingItem__propertyValue">
                        <img width="24" height="24" src="/cms/images/icons/general-icons/${(method.isWithdraw)?'yes.png':'no.svg'}" alt="${(method.isWithdraw)?'Yes':'No'}">
                    </div>
                </div>
                <div class="bankingItem__property">
                    <div class="bankingItem__propertyKey">Free fixed</div>
                    <div class="bankingItem__propertyValue">${method.freeFixed}</div>
                </div>
                <div class="bankingItem__property">
                    <div class="bankingItem__propertyKey">Free %</div>
                    <div class="bankingItem__propertyValue">${method.freePercent}</div>
                </div>
                <div class="bankingItem__property">
                    <div class="bankingItem__propertyKey">Min/Max<br>deposit</div>
                    <div class="bankingItem__propertyValue">
                      ${(method.isDeposit)? minmaxTemplate(method.minDeposit, method.maxDeposit) : '—'}
                    </div>
                </div>
                <div class="bankingItem__property">
                    <div class="bankingItem__propertyKey">Min/Max<br>Withdrawal</div>
                    <div class="bankingItem__propertyValue">
                        ${(method.isWithdraw)? minmaxTemplate(method.minWithdrawal, method.maxWithdrawal) : '—'}
                    </div>
                </div>
            </div>
        </div>
    </accordion-group>
    `
  })}
  </accordion>
  `
}
function getPaymentImage(payemntTitle){
  let basePath = '/cms/images/icons/bank-page/'
  switch (payemntTitle) {
    case 'Credit Card':
      return basePath + 'epro_370001.png'
    case 'EPRO':
      return basePath + 'epro_370001.png'
    case 'Trustly':
      return basePath + 'trustly_300001.png'
    case 'NETELLER':
      return basePath + 'neteller_110002.png'
    case 'Skrill':
      return basePath + 'moneybookers_70002.png'
    case 'paysafecard':
      return basePath + 'paysafe_10001.png'
    case 'Ecopayz':
      return basePath + 'ecopayz_240001.png'
    case 'GiroPay':
      return basePath + 'lateral_130005.png'
    case 'iDeal':
      return basePath + 'lateral_130011.png'
    case 'P24':
      return basePath + 'lateral_130013.png'
    case 'SafetyPay':
      return basePath + 'lateral_130016.png'
    case 'EPS':
      return basePath + 'lateral_130010.png'
    case 'QIWI':
      return basePath + 'lateral_130009.png'
    case 'SOFORT (directpay)':
      return basePath + 'lateral_130006.png'
    case 'Neosurf':
      return basePath + 'apco_270041.png'
    case 'UPAY':
      return basePath + 'apco_270041.png'
    default:
      return '#ERROR#'
  }
}

class Exception {
  constructor(msg, data = null, name = 'Exception'){
    this.message = msg
    this.name    = name
    this.value   = data
  }
  toString(){
    let msg = `[${this.name}] ${this.message}`
    if(this.value !== null){
      msg += SYMBOL.EOL + JSON.stringify(this.value, null, 2)
    }
    return msg
  }
}

function parseCsv(data){
  return new Promise((resolve,reject)=>{
    csv.parse(data, (err, data)=>{
      if(err){
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

function readTextFile(filename){
  return new Promise((resolve,reject)=>{
    fs.readFile(filename, IN_FILE_ENCODING, (err, data)=>{
      if(err){
        reject(err, filename)
      } else {
        resolve(data, filename)
      }
    })
  })
}

function writeTextFile(filename, data){
  return new Promise((resolve,reject)=>{
    fs.writeFile(filename, data, OUT_FILE_ENCODING, (err, data)=>{
      if(err){
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

class PaymentInfo {
  static fromCsv(csv){
    return {
      title: csv[0],
      image: getPaymentImage(csv[0]),
      isDeposit: (csv[1] === 'Y'),
      isWithdraw: (csv[2] === 'Y'),
      freeFixed: csv[3],
      freePercent: csv[4],
      minDeposit: PaymentInfo.splitMoneySek(csv[5]),
      maxDeposit: PaymentInfo.splitMoneySek(csv[6]),
      minWithdrawal: PaymentInfo.splitMoneySek(csv[7]),
      maxWithdrawal: PaymentInfo.splitMoneySek(csv[8])
    }
  }
  static listFromCsv(csvList){
    let list = []
    for (let payment of csvList) {
      list.push( PaymentInfo.fromCsv(payment) )
    }
    return list
  }
  static parseMoney(str){
    let value = str.match(/[0-9]+/)[0]
    let currencies = []
    /// TODO : make pretty
    if( str.includes('EUR') ){
      currencies.push('EUR')
    }
    if( str.includes('GBP') ){
      currencies.push('GBP')
    }
    return {value, currencies}
  }
  static parseSeknok(str){
    let value = str.match(/[0-9]+/)[0]
    let seknok = []
    /// TODO : make pretty
    if( str.includes('SEK') ){
      seknok.push('SEK')
    }
    if( str.includes('NOK') ){
      seknok.push('NOK')
    }
    return {value, seknok}
  }
  static splitMoneySek(str){
    let x = str.split('|')
    let money = false
    let seknok = false

    // trim spaces
    x[0] = x[0].trim()
    if( x[1] ){
      x[1] = x[1].trim()
    }

    // different combinations
    if(x.length === 1){
      if(x[0] === '-'){
        money = false
        seknok = false
        // return false ?
      } else if(x[0].includes('EUR') || x[0].includes('GBP')){
        money = x[0]
        seknok = false
      } else if(x[0].includes('SEK') || x[0].includes('NOK')) {
        money = false
        seknok = x[0]
      }
    } else {
      money = x[0]
      seknok = x[1]
    }

    if(money !== false){
      money = PaymentInfo.parseMoney(money)
    }
    if(seknok !== false){
      seknok = PaymentInfo.parseSeknok(seknok)
    }

    return {money, seknok}
  }
}

class Application {
  constructor(args){
    this.args  = args
    this.files = this.args.slice(2, this.args.length)
  }

  async run(){
    try {
      for(let file of this.files){
        let data = await readTextFile(file)
        let outFilename = file

        if( /.+\.csv$/.test(file) ){
          outFilename = outFilename + '.html'
          data = await parseCsv(data)
          data.splice(0, 1)
          data = PaymentInfo.listFromCsv(data)
          data = mobilePaymentTemplate(data)
          // data = JSON.stringify(data, null, PRETTY_TAB_SIZE * PRETTY_OUT_JSON)

        } else {
          console.log('Unrecognized file extension')
          return false
        }

        await writeTextFile(outFilename, data)
        // console.log( JSON.stringify(data, null, 2) )
        // console.log( data );
        return true
      }
    } catch(e){
      console.log(e)
    }
  }
}

(function main(args){
  let app = new Application(args)
  app.run()
})(process.argv)
