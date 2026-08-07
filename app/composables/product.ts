// app/composables/product.ts
import { ref, reactive } from 'vue'

// Interface untuk memastikan tipe data konsisten
export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  sku: string | null
  image: string | null
  price: number
  costPrice: number | null
  stock: number
  categoryId: number
  isActive: boolean
  category?: Category
}

export interface ProductPayload {
  name: string
  sku: string | null
  image: string | null
  price: number
  costPrice: number | null
  stock: number
  categoryId: number
  isActive: boolean
}

export function useProductManager() {
  const { $swal } = useNuxtApp()
  
  // State
  const isFormOpen = ref(false)
  const isSaving = ref(false)
  const editingProduct = ref<Product | null>(null)
  const formError = ref<string | null>(null)

  // Inisialisasi Form
  const form = reactive<ProductPayload>({
    name: '',
    sku: '',
    image: '',
    price: 0,
    costPrice: null,
    stock: 0,
    categoryId: 0,
    isActive: true,
  })

  // Validasi Standar (Sisi Client)
  const validate = (data: ProductPayload): string | null => {
    if (!data.categoryId) return 'Kategori wajib dipilih.'
    if (!data.name || data.name.trim() === '') return 'Nama produk wajib diisi.'
    if (data.price <= 0) return 'Harga jual wajib diisi dan harus lebih dari 0.'
    if (data.stock < 0) return 'Stok tidak boleh negatif.'
    return null
  }

  // Operasi CRUD
  const saveProduct = async (onSuccess: () => void) => {
    const error = validate(form)
    if (error) {
      formError.value = error
      return
    }

    isSaving.value = true
    formError.value = null

    try {
      const payload: ProductPayload = {
        ...form,
        name: form.name.trim(),
        sku: form.sku?.trim() || null,
        image: form.image?.trim() || null,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        stock: parseInt(String(form.stock), 10),
        categoryId: Number(form.categoryId),
      }

      if (editingProduct.value) {
        await $fetch(`/api/products/${editingProduct.value.id}`, { method: 'PUT', body: payload })
      } else {
        await $fetch('/api/products', { method: 'POST', body: payload })
      }

      $swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: editingProduct.value ? 'Produk diperbarui' : 'Produk ditambahkan',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      })

      onSuccess()
      closeForm()
    } catch (err: any) {
      formError.value = err.data?.message || 'Gagal menyimpan data.'
    } finally {
      isSaving.value = false
    }
  }

  const deleteProduct = async (product: Product, onSuccess: () => void) => {
    const result = await $swal.fire({
      title: 'Hapus Produk?',
      text: `"${product.name}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      try {
        await $fetch(`/api/products/${product.id}`, { method: 'DELETE' })
        $swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Produk dihapus', showConfirmButton: false, timer: 2000 })
        onSuccess()
      } catch (err: any) {
        $swal.fire({ icon: 'error', title: 'Gagal', text: err.data?.message || 'Terjadi kesalahan.' })
      }
    }
  }

  const openForm = (product: Product | null, categories: Category[]) => {
    if (categories.length === 0) {
      $swal.fire({ icon: 'warning', title: 'Kategori Kosong', text: 'Buat kategori dulu!' })
      return
    }
    
    editingProduct.value = product
    if (product) {
      Object.assign(form, product)
    } else {
      Object.assign(form, { name: '', sku: '', image: '', price: 0, costPrice: null, stock: 0, categoryId: categories[0].id, isActive: true })
    }
    isFormOpen.value = true
  }

  const closeForm = () => {
    isFormOpen.value = false
    editingProduct.value = null
  }

  return {
    form,
    isFormOpen,
    isSaving,
    editingProduct,
    formError,
    saveProduct,
    deleteProduct,
    openForm,
    closeForm
  }
}