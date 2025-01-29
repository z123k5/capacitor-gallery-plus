import { SplashScreen } from "@capacitor/splash-screen";
import { Camera } from "@capacitor/camera";
import { GalleryPlus } from "capacitor-gallery-plus";

window.customElements.define(
  "capacitor-welcome",
  class extends HTMLElement {
    constructor() {
      super();

      SplashScreen.hide();
      console.log("GALLERY PLUS", GalleryPlus);

      const root = this.attachShadow({ mode: "open" });

      root.innerHTML = `
      <style>
        :host {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
        }
        button {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          border: none;
          background: #007bff;
          color: white;
          border-radius: 5px;
        }
      </style>
      <div>
        <h2>Welcome to Capacitor</h2>
        <button id="testGetMedias">Test getMedias()</button>
        <pre id="output"></pre>
      </div>
      `;

      this.shadowRoot
        .querySelector("#testGetMedias")
        .addEventListener("click", async () => {
          await this.testGetMedias();
        });
    }

    async testGetMedias() {
      try {
        // Berechtigungen anfordern
        const permission = await GalleryPlus.checkPermissions();
        if (permission.status !== "granted") {
          const request = await GalleryPlus.requestPermissions();
          if (request.status !== "granted") {
            console.error("No permission granted.");
            return;
          }
        }

        // `getMedias` ausführen
        const mediaResult = await GalleryPlus.getMedias({
          type: "all",
          startAt: 0,
          limit: 10,
          sort: "newest",
          includeDetails: true,
          includeBaseColor: true,
          thumbnailSize: 200
        });

        console.log("Media:", mediaResult.media);
        this.shadowRoot.querySelector("#output").textContent = JSON.stringify(
          mediaResult.media,
          null,
          2
        );
      } catch (error) {
        console.error("Error on getMedias:", error);
      }
    }
  }
);
