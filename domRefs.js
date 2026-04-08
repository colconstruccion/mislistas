export const DOM = {
  app: {
    protected: document.getElementById("protected"),
    authLoading: document.getElementById("auth-loading"),
    layout: document.getElementById("appLayout"),
    toastMessage: document.getElementById("toastMessage"),
  },

  sidebar: {
    logoutBtn: document.getElementById("logoutBtn"),
    loadDocLink: document.getElementById("loadDocLink"),
    myDocsLink: document.getElementById("myDocsLink"),
    searchDocsLink: document.getElementById("searchDocsLink"),
    createListsLink: document.getElementById("createListsLink"),
    createListsMenu: document.getElementById("createListsMenu"),

    oneColumnList: document.getElementById("one-column-list"),
    twoColumnList: document.getElementById("two-column-list"),
    threeColumnList: document.getElementById("three-column-list"),

    toggleFormsBtn: document.getElementById("toggleFormsBtn"),
    formsSubmenu: document.getElementById("formsSubmenu"),
    openCreateLoginLink: document.getElementById("openCreateLoginLink"),

    myFormsLink: document.getElementById("myFormsLink"),
    myFormsSubmenu: document.getElementById("myFormsSubmenu"),
    myLoginsLink: document.getElementById("myLoginsLink"),

    mergePdfLink: document.getElementById("mergePdfLink"),
    myAccountLink: document.getElementById("myAccountLink"),

    billingPanel: document.getElementById("billingPanel"),
    planLabel: document.getElementById("planLabel"),
    pointsLabel: document.getElementById("pointsLabel"),
  },

  search: {
    box: document.getElementById("search-box"),
    publicIdInput: document.getElementById("publicIdInput"),
    searchPublicDocBtn: document.getElementById("searchPublicDocBtn"),
    searchResultMsg: document.getElementById("searchResultMsg"),
  },

  savedLists: {
    view: document.getElementById("savedListsView"),
  },

  editor: {
    formContainer: document.getElementById("formContainer"),
    listForm: document.getElementById("listForm"),
    title: document.getElementById("title"),
    itemsContainer: document.getElementById("itemsContainer"),
    richTextContainer: document.getElementById("richTextContainer"),
    toolbar: document.getElementById("toolbar"),
    editor: document.getElementById("editor"),

    toggleCheckboxesBtn: document.getElementById("toggleCheckboxesBtn"),
    toggleNoteBoxBtn: document.getElementById("toggleNoteBoxBtn"),
    addRowBtn: document.getElementById("addRowBtn"),
    deleteRowBtn: document.getElementById("deleteRowBtn"),
    addColumnBtn: document.getElementById("addColumnBtn"),
    deleteColumnBtn: document.getElementById("deleteColumnBtn"),
    toggleLinksBtn: document.getElementById("toggleLinksBtn"),

    saveAsCopyBtn: document.getElementById("saveAsCopyBtn"),
    saveCloudBtn: document.getElementById("saveCloudBtn"),
    headerImageInput: document.getElementById("headerImageInput"),
    uploadHeaderBtn: document.getElementById("uploadHeaderBtn"),
    footerImageInput: document.getElementById("footerImageInput"),
    uploadFooterBtn: document.getElementById("uploadFooterBtn"),
    savePreviewPdfBtn: document.getElementById("savePreviewPdfBtn"),
  },

  documents: {
    docUploadPanel: document.getElementById("docUploadPanel"),
    docUploadForm: document.getElementById("docUploadForm"),
    docTitle: document.getElementById("docTitle"),
    docFile: document.getElementById("docFile"),
    docUploadHint: document.getElementById("docUploadHint"),
    docUploadBtn: document.getElementById("docUploadBtn"),
    docUploadCancelBtn: document.getElementById("docUploadCancelBtn"),
    docUploadStatus: document.getElementById("docUploadStatus"),

    shareDocPanel: document.getElementById("shareDocPanel"),
    shareDocForm: document.getElementById("shareDocForm"),
    shareDocId: document.getElementById("shareDocId"),
    sharePublicId: document.getElementById("sharePublicId"),
    shareDocTitle: document.getElementById("shareDocTitle"),
    shareRecipientEmail: document.getElementById("shareRecipientEmail"),
    shareEmailMessage: document.getElementById("shareEmailMessage"),
    sendShareEmailBtn: document.getElementById("sendShareEmailBtn"),
    shareDocCancelBtn: document.getElementById("shareDocCancelBtn"),
    shareDocStatus: document.getElementById("shareDocStatus"),

    documentList: document.getElementById("documentList"),
    pdfViewerPanel: document.getElementById("pdfViewerPanel"),
    pdfFrame: document.getElementById("pdfFrame"),
  },

  preview: {
    container: document.getElementById("preview-container"),
    livePreviewHeader: document.getElementById("livePreviewHeader"),
    previewTitle: document.getElementById("previewTitle"),
    previewItems: document.getElementById("previewItems"),
    notePreview: document.getElementById("notePreview"),
  },

  account: {
    myAccountPanel: document.getElementById("myAccountPanel"),
    accountEmail: document.getElementById("accountEmail"),
    accountChangePasswordBtn: document.getElementById("accountChangePasswordBtn"),
    accountDeleteBtn: document.getElementById("accountDeleteBtn"),
    accountMsg: document.getElementById("accountMsg"),
  },

  forms: {
    createLoginPanel: document.getElementById("createLoginPanel"),
    loginFormPanel: document.getElementById("loginFormPanel"),
    loginAccount: document.getElementById("loginAccount"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    togglePasswordBtn: document.getElementById("togglePasswordBtn"),
    copyPasswordBtn: document.getElementById("copyPasswordBtn"),
    saveLoginFormBtn: document.getElementById("saveLoginFormBtn"),
    loginFormStatus: document.getElementById("loginFormStatus"),

    formsListPanel: document.getElementById("formsListPanel"),
    formsTableWrap: document.getElementById("formsTableWrap"),
  },

  vault: {
    vaultPanel: document.getElementById("vaultPanel"),
    vaultPanelTitle: document.getElementById("vaultPanelTitle"),
    vaultKeyInput: document.getElementById("vaultKeyInput"),
    vaultConfirmWrap: document.getElementById("vaultConfirmWrap"),
    vaultKeyConfirm: document.getElementById("vaultKeyConfirm"),
    vaultActionBtn: document.getElementById("vaultActionBtn"),
    lockVaultBtn: document.getElementById("lockVaultBtn"),
    deleteVaultBtn: document.getElementById("deleteVaultBtn"),
    vaultStatus: document.getElementById("vaultStatus"),
  },
};