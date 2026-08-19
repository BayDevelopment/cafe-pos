// app/composables/useProductManager.ts
export const useProductManager = () => {
  const isFormOpen = ref(false)
  const isSaving = ref(false)
  const editingProduct = ref<any>(null)
  const formError = ref('')
  const imagePreview = ref('')
  const selectedFile = ref<File | null>(null)

  const form = reactive({
    name: '',
    sku: '',
    price: 0,
    discount: 0, // <-- Added
    costPrice: 0,
    stock: 0,
    categoryId: 0,
    isActive: true,
  })

  function resetForm() {
    form.name = ''
    form.sku = ''
    form.price = 0
    form.discount = 0 // <-- Added
    form.costPrice = 0
    form.stock = 0
    form.categoryId = 0
    form.isActive = true
    editingProduct.value = null
    formError.value = ''
    imagePreview.value = ''
    selectedFile.value = null
  }

  function openForm(product: any = null, categories: any[] = []) {
    resetForm()
    if (product) {
      editingProduct.value = product
      form.name = product.name
      form.sku = product.sku || ''
      form.price = product.price
      form.discount = product.discount || 0 // <-- Added
      form.costPrice = product.costPrice || 0
      form.stock = product.stock
      form.categoryId = product.categoryId
      form.isActive = product.isActive
      if (product.image) imagePreview.value = product.image
    } else if (categories.length > 0) {
      form.categoryId = categories[0].id
    }
    isFormOpen.value = true
  }

  function closeForm() {
    isFormOpen.value = false
    resetForm()
  }

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      formError.value = 'Format file harus PNG atau JPG/JPEG.'
      input.value = ''
      return
    }

    if (file.size > 1 * 1024 * 1024) {
      formError.value = 'Ukuran file gambar maksimal 1 MB.'
      input.value = ''
      return
    }

    formError.value = ''
    selectedFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }

  async function saveProduct(refreshCallback?: Function) {
    if (isSaving.value) return
    formError.value = ''

    if (!form.name.trim()) return (formError.value = 'Nama produk wajib diisi.')
    if (!form.categoryId) return (formError.value = 'Kategori wajib dipilih.')
    if (form.price <= 0) return (formError.value = 'Harga jual harus lebih dari 0.')

    isSaving.value = true

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('sku', form.sku)
      formData.append('price', String(form.price))
      formData.append('discount', String(form.discount || 0)) // <-- Added
      formData.append('costPrice', String(form.costPrice))
      formData.append('stock', String(form.stock))
      formData.append('categoryId', String(form.categoryId))
      formData.append('isActive', String(form.isActive))

      if (selectedFile.value) {
        formData.append('image', selectedFile.value)
      }

      const url = editingProduct.value ? `/api/products/${editingProduct.value.id}` : '/api/products'
      const method = editingProduct.value ? 'PUT' : 'POST'

      await $fetch(url, { 
        method, 
        body: formData,
        credentials: 'include' 
      })

      closeForm()
      if (refreshCallback) refreshCallback()
    } catch (err: any) {
      formError.value = err.data?.message || 'Terjadi kesalahan saat menyimpan data.'
    } finally {
      isSaving.value = false
    }
  }

  async function deleteProduct(product: any, refreshCallback?: Function) {
    await $fetch(`/api/products/${product.id}`, { 
      method: 'DELETE',
      credentials: 'include'
    })
    if (refreshCallback) refreshCallback()
  }

  return {
    form,
    isFormOpen,
    isSaving,
    editingProduct,
    formError,
    imagePreview,
    handleFileChange,
    saveProduct,
    deleteProduct,
    openForm,
    closeForm,
  }
}