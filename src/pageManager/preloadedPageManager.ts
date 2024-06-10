import { type Browser, type Page } from 'puppeteer'
import { logger } from '../utils/logger'

type PreloadConfig = Record<string, { url: string }>

type PreloadedPages = Record<string, { url: string, pages: Page[] }>

export class PreloadedPageManager {
  private readonly preloadedPages: PreloadedPages

  private readonly poolSize: number

  private constructor (private readonly puppeteerBrowser: Browser, preloadConfig: PreloadConfig, poolSize: number) {
    this.preloadedPages = Object.keys(preloadConfig).reduce<PreloadedPages>((acc, label) => {
      acc[label.toUpperCase()] = { url: preloadConfig[label].url, pages: [] }
      return acc
    }, {})
    this.poolSize = poolSize
  }

  public async acquirePage (court: string): Promise<Page> {
    logger.info('Acquiring preloaded page')
    if (this.preloadedPages[court].pages.length === 0) {
      return await this.createPreloadedPage(this.preloadedPages[court].url)
    } else {
      return this.preloadedPages[court].pages.pop()!
    }
  }

  public async releasePage (page: Page, court: string): Promise<void> {
    await page.goto(this.preloadedPages[court].url)
    this.preloadedPages[court].pages.push(page)
  }

  private async init (): Promise<void> {
    const promises: Array<Promise<Page>> = []
    for (const label in this.preloadedPages) {
      for (let i = 0; i < this.poolSize; i++) {
        promises.push(this.createPreloadedPage(this.preloadedPages[label].url))
      }
    }
    const loadedPages = await Promise.all(promises)
    let currentIndex = 0
    for (const label in this.preloadedPages) {
      this.preloadedPages[label].pages = loadedPages.slice(currentIndex, currentIndex + this.poolSize)
      currentIndex += this.poolSize
    }
  }

  private async createNewPage (): Promise<Page> {
    logger.info('Creating new preloaded page')
    const newBrowserContext = await this.puppeteerBrowser.createIncognitoBrowserContext()
    return await newBrowserContext.newPage()
  }

  private async createPreloadedPage (preloadUrl: string): Promise<Page> {
    const newPage = await this.createNewPage()
    await newPage.goto(preloadUrl)
    return newPage
  }

  public static async create (puppeteerBrowser: Browser, preloadConfig: PreloadConfig, poolSize: number): Promise<PreloadedPageManager> {
    logger.info('Creating new preloaded page manager')
    const preloadedPageManager = new PreloadedPageManager(puppeteerBrowser, preloadConfig, poolSize)
    await preloadedPageManager.init()
    return preloadedPageManager
  }
}
